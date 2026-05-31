import { connectToDatabase } from "../../../lib/mongoconnect";
import { createRouter } from "next-connect";
import multer from "multer";
import fs from "fs";
import path from "path";
import { ObjectId } from "mongodb";

// Configure multer using memory storage.
// Enforce a global max file size limit of 30MB in multer as safety net.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024,
  },
});

const apiRoute = createRouter();

// Use multer middleware (supports up to 5 files at a time)
apiRoute.use(upload.array("files", 5));

// POST: Upload files with tab-specific constraints
apiRoute.post(async (req, res) => {
  try {
    const { projectWbs, projectName, tabId, uploadedBy, uploadedByEmail } = req.body;

    if (!projectWbs) {
      return res.status(400).json({ error: "Project WBS is required" });
    }
    if (!tabId) {
      return res.status(400).json({ error: "Tab ID is required" });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one file is required" });
    }

    // 1. Enforce validation on files based on tab constraints
    for (const file of req.files) {
      const originalName = file.originalname;
      const extension = path.extname(originalName).toLowerCase();
      const sizeInMB = file.size / (1024 * 1024);

      if (tabId === "project-drawings") {
        const allowedExtensions = [".dwg", ".dxf", ".pdf"];
        if (!allowedExtensions.includes(extension)) {
          return res.status(400).json({
            error: `File validation failed: '${originalName}' is not allowed. Only CAD Drawings (.dwg, .dxf) and PDF files can be uploaded under Project Drawings.`
          });
        }
        if (sizeInMB > 25) {
          return res.status(400).json({
            error: `File validation failed: '${originalName}' is ${sizeInMB.toFixed(2)}MB. Drawings cannot exceed 25MB.`
          });
        }
      } else if (
        tabId === "client-correspondence" ||
        tabId === "supplier-correspondence" ||
        tabId === "subcontract-correspondence"
      ) {
        const allowedExtensions = [".eml", ".msg", ".pdf"];
        if (!allowedExtensions.includes(extension)) {
          return res.status(400).json({
            error: `File validation failed: '${originalName}' is not allowed. Only email files (.eml, .msg) and PDF files can be uploaded under Correspondence.`
          });
        }
        if (sizeInMB > 10) {
          return res.status(400).json({
            error: `File validation failed: '${originalName}' is ${sizeInMB.toFixed(2)}MB. Correspondence files cannot exceed 10MB.`
          });
        }
      } else {
        // All other tabs
        const allowedExtensions = [".docx", ".pdf", ".jpeg", ".jpg"];
        if (!allowedExtensions.includes(extension)) {
          return res.status(400).json({
            error: `File validation failed: '${originalName}' is not allowed. Only Word documents (.docx), PDFs (.pdf), and Images (.jpeg, .jpg) are allowed here.`
          });
        }
        if (sizeInMB > 10) {
          return res.status(400).json({
            error: `File validation failed: '${originalName}' is ${sizeInMB.toFixed(2)}MB. Files cannot exceed 10MB.`
          });
        }
      }
    }

    // 2. Prepare upload directory
    const sanitizedProjectWbs = projectWbs.replace(/[^a-zA-Z0-9]/g, "_");
    const sanitizedTabId = tabId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "projectdocuments",
      sanitizedProjectWbs,
      sanitizedTabId
    );

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const { db } = await connectToDatabase();
    const documents = [];

    // 3. Process each file, write to disk, prepare metadata
    for (const file of req.files) {
      const timestamp = Date.now();
      const originalName = file.originalname;
      const extension = path.extname(originalName);
      const baseName = path.basename(originalName, extension);

      // Clean/sanitize base name
      const sanitizedBaseName = baseName
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .substring(0, 50);

      const uniqueName = `${sanitizedBaseName}_${timestamp}${extension}`;
      const filePath = path.join(uploadDir, uniqueName);

      // Save to disk
      fs.writeFileSync(filePath, file.buffer);

      // Add to database metadata list
      const documentMetadata = {
        projectWbs,
        projectName: projectName || "Unknown Project",
        tabId,
        filename: uniqueName,
        originalName,
        filePath: `/uploads/projectdocuments/${sanitizedProjectWbs}/${sanitizedTabId}/${uniqueName}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date().toISOString(),
        uploadedBy: uploadedBy || "Unknown",
        uploadedByEmail: uploadedByEmail || "",
      };

      documents.push(documentMetadata);
    }

    // 4. Save metadata records in database
    const result = await db.collection("project_documents_files").insertMany(documents);

    res.status(201).json({
      success: true,
      message: `${documents.length} document(s) uploaded successfully`,
      documents,
      ids: result.insertedIds,
    });
  } catch (error) {
    console.error("Upload handler error:", error);
    res.status(500).json({ error: error.message || "An error occurred while uploading" });
  }
});

// GET: Retrieve list of uploaded files for a project and tab
apiRoute.get(async (req, res) => {
  try {
    const { projectWbs, tabId } = req.query;

    if (!projectWbs) {
      return res.status(400).json({ error: "Project WBS query parameter is required" });
    }
    if (!tabId) {
      return res.status(400).json({ error: "Tab ID query parameter is required" });
    }

    const { db } = await connectToDatabase();
    const list = await db
      .collection("project_documents_files")
      .find({ projectWbs, tabId })
      .sort({ uploadedAt: -1 })
      .toArray();

    res.status(200).json(list);
  } catch (error) {
    console.error("List fetch error:", error);
    res.status(500).json({ error: "Failed to retrieve documents list" });
  }
});

const parseJsonBody = (req) => {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === "object") {
      return resolve(req.body);
    }
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on("error", () => {
      resolve({});
    });
  });
};

// DELETE: Delete a document
apiRoute.delete(async (req, res) => {
  try {
    let id = req.query.id;
    if (!id) {
      const body = await parseJsonBody(req);
      id = body.id;
    }

    if (!id) {
      return res.status(400).json({ error: "Document ID is required" });
    }

    const { db } = await connectToDatabase();
    const doc = await db
      .collection("project_documents_files")
      .findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return res.status(404).json({ error: "Document not found in database" });
    }

    // Attempt to delete physical file from disk
    const diskPath = path.join(process.cwd(), "public", doc.filePath);
    try {
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
    } catch (fsErr) {
      console.warn(`Warning: Could not delete physical file at ${diskPath}`, fsErr);
    }

    // Delete record from database
    await db.collection("project_documents_files").deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

export default apiRoute.handler({
  onError: (err, req, res) => {
    console.error("API Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  },
  onNoMatch: (req, res) => {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

export const config = {
  api: {
    bodyParser: false, // multer handles parsing
  },
};
