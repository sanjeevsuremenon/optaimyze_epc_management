import { connectToDatabase } from "../../../../../lib/mongoconnect";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const { vendorcode, documentId } = req.query;

  if (!vendorcode || !documentId) {
    return res.status(400).json({ error: 'Vendor code and document ID are required' });
  }

  try {
    const { db } = await connectToDatabase();

    switch (req.method) {
      case 'DELETE': {
        // First, get the document to find the file path
        const document = await db.collection('vendordocuments').findOne({
          _id: documentId,
          vendorCode: vendorcode
        });

        if (!document) {
          return res.status(404).json({ error: 'Document not found' });
        }

        // Delete the physical file
        // Build the public directory name without the literal 'public' token
        // so Turbopack doesn't over-eagerly match static file patterns.
        // construct 'public' at runtime to avoid static analysis
        const publicDirName = Buffer.from([112,117,98,108,105,99]).toString();
        const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), publicDirName, vendorcode, document.filename);
        
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          console.warn('Could not delete physical file:', fileError.message);
          // Continue with database deletion even if file deletion fails
        }

        // Delete the document record from database
        const result = await db.collection('vendordocuments').deleteOne({
          _id: documentId,
          vendorCode: vendorcode
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Document not found' });
        }

        return res.status(200).json({
          success: true,
          message: 'Document deleted successfully'
        });
      }

      case 'GET': {
        // Get a specific document
        const document = await db.collection('vendordocuments').findOne({
          _id: documentId,
          vendorCode: vendorcode
        });

        if (!document) {
          return res.status(404).json({ error: 'Document not found' });
        }

        return res.status(200).json(document);
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing the request' 
    });
  }
}
