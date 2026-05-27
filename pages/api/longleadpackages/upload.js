import { connectToDatabase } from "../../../lib/mongoconnect";
import nextConnect from "next-connect";
import multer from "multer";
import fs from "fs";
import path from "path";
import { ObjectId } from "mongodb";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|xls|xlsx/i;
    const extname = allowedTypes.test(path.extname(file.originalname));
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF, DOC, DOCX, JPG, JPEG, PNG, XLS, and XLSX files are allowed"
        )
      );
    }
  },
});

const apiRoute = nextConnect({
  onError: (err, req, res) => {
    console.error("API Error:", err);
    res.status(500).json({ error: err.message });
  },
  onNoMatch: (req, res) => {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

// Use multer middleware
apiRoute.use(upload.array("files", 10)); // Allow up to 10 files

// Handle POST request
apiRoute.post(async (req, res) => {
  try {
    const { packageId, projectWbs, uploadedBy, uploadedByEmail } = req.body;

    if (!packageId) {
      return res.status(400).json({ error: "Package ID is required" });
    }

    if (!projectWbs) {
      return res.status(400).json({ error: "Project WBS is required" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one file is required" });
    }

    // Create project-specific directory for package documents
    const sanitizedProjectWbs = projectWbs.replace(/\//g, "_");
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "longleadpackages",
      sanitizedProjectWbs,
      packageId
    );

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

      // Sanitize filename
      const sanitizedBaseName = baseName
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .substring(0, 50);

      const uniqueName = `${sanitizedBaseName}_${timestamp}${extension}`;

      // Save file to disk
      const filePath = path.join(uploadDir, uniqueName);
      fs.writeFileSync(filePath, file.buffer);

      // Prepare document data
      const documentData = {
        filename: uniqueName,
        originalName: file.originalname,
        filePath: `/longleadpackages/${sanitizedProjectWbs}/${packageId}/${uniqueName}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date().toISOString(),
        uploadedBy: uploadedBy || "Unknown",
        uploadedByEmail: uploadedByEmail || "",
      };

      documents.push(documentData);
    }

    // Update package with new documents
    const packageDoc = await db
      .collection("longleadpackages")
      .findOne({ _id: new ObjectId(packageId) });

    if (!packageDoc) {
      return res.status(404).json({ error: "Package not found" });
    }

    // Merge new documents with existing ones
    const existingDocuments = packageDoc.packageDocuments || [];
    const updatedDocuments = [...existingDocuments, ...documents];

    await db.collection("longleadpackages").updateOne(
      { _id: new ObjectId(packageId) },
      {
        $set: {
          packageDocuments: updatedDocuments,
          updatedAt: new Date(),
          updatedBy: uploadedBy || "Unknown",
          updatedByEmail: uploadedByEmail || "",
        },
      }
    );

    res.status(200).json({
      success: true,
      message: `${documents.length} document(s) uploaded successfully`,
      documents: documents,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: error.message || "An error occurred while uploading documents",
    });
  }
});

export default apiRoute;

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, let multer handle it
  },
};
