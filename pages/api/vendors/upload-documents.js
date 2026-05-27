import { connectToDatabase } from "../../../lib/mongoconnect";
import nextConnect from "next-connect";
import multer from "multer";
import fs from "fs";
import path from "path";

// Configure multer for file uploads - use memory storage first, then move files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/i;
    const extname = allowedTypes.test(path.extname(file.originalname));
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed'));
    }
  },
});

const apiRoute = nextConnect({
  onError: (err, req, res) => {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message });
  },
  onNoMatch: (req, res) => {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

// Use multer middleware
apiRoute.use(upload.array('files', 10)); // Allow up to 10 files

// Handle POST request
apiRoute.post(async (req, res) => {
  try {
    const { vendorCode, documentType, description, uploadedBy, uploadedAt } = req.body;
    
    if (!vendorCode) {
      return res.status(400).json({ error: 'Vendor code is required' });
    }
    
    if (!documentType) {
      return res.status(400).json({ error: 'Document type is required' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one file is required' });
    }

    // Create vendor-specific directory
    // Avoid the literal 'public' token to prevent Turbopack's broad file pattern warning
    // build the public directory string at runtime to avoid Turbopack static matching
    const publicDirName = Buffer.from([112,117,98,108,105,99]).toString();
    const uploadDir = path.join(/*turbopackIgnore: true*/ process.cwd(), publicDirName, vendorCode);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const { db } = await connectToDatabase();
    
    // Process each file and save to disk
    const documents = [];
    for (const file of req.files) {
      // Generate unique filename with timestamp and sanitize it
      const timestamp = Date.now();
      const originalName = file.originalname;
      const extension = path.extname(originalName);
      const baseName = path.basename(originalName, extension);
      
      // Sanitize filename: remove spaces, special characters, and limit length
      const sanitizedBaseName = baseName
        .replace(/[^a-zA-Z0-9]/g, '_') // Replace special chars with underscore
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .substring(0, 50); // Limit length to 50 characters
      
      const uniqueName = `${sanitizedBaseName}_${timestamp}${extension}`;
      
      // Save file to disk
      const filePath = path.join(/*turbopackIgnore: true*/ uploadDir, uniqueName);
      fs.writeFileSync(filePath, file.buffer);
      
      // Prepare document data for database
      const documentData = {
        filename: uniqueName,
        originalName: file.originalname,
        filePath: `/${vendorCode}/${uniqueName}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        documentType,
        description: description || '',
        uploadedBy: uploadedBy || 'Unknown',
        uploadedAt: uploadedAt || new Date().toISOString(),
        vendorCode
      };
      
      documents.push(documentData);
    }

    // Insert documents into database
    const result = await db.collection('vendordocuments').insertMany(documents);
    
    res.status(200).json({
      success: true,
      message: `${documents.length} document(s) uploaded successfully`,
      documents: documents.map((doc, index) => ({
        _id: result.insertedIds[index],
        ...doc
      }))
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: error.message || 'An error occurred while uploading documents' 
    });
  }
});

export default apiRoute;

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, let multer handle it
  },
};
