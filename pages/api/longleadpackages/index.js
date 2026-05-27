import { connectToDatabase } from "../../../lib/mongoconnect";
import { ObjectId } from "mongodb";

const handler = async (req, res) => {
  try {
    const { db } = await connectToDatabase();

    switch (req.method) {
      case "GET": {
        const { projectWbs } = req.query;

        let condition = {};
        if (projectWbs) {
          condition = { projectWbs: projectWbs };
        }

        const packages = await db
          .collection("longleadpackages")
          .find(condition)
          .sort({ createdAt: -1 })
          .toArray();

        return res.json(packages);
      }

      case "POST": {
        const {
          projectWbs,
          projectName,
          packageName,
          packageDescription,
          dateSharedFromDesigner,
          dateSharedToMMDByProject,
          dateRFQFloated,
          dateOffersSharedWithProject,
          poDate,
          packageDocuments = [],
          poNumbers = [],
          createdBy,
          createdByEmail,
          updatedBy,
          updatedByEmail,
        } = req.body;

        if (!projectWbs || !packageName) {
          return res.status(400).json({
            error: "Project WBS and Package Name are required",
          });
        }

        const packageData = {
          projectWbs,
          projectName: projectName || "",
          packageName,
          packageDescription: packageDescription || "",
          dateSharedFromDesigner: dateSharedFromDesigner || null,
          dateSharedToMMDByProject: dateSharedToMMDByProject || null,
          dateRFQFloated: dateRFQFloated || null,
          dateOffersSharedWithProject: dateOffersSharedWithProject || null,
          poDate: poDate || null,
          packageDocuments: Array.isArray(packageDocuments) ? packageDocuments : [],
          poAssignments: [], // Array of objects: { poNumber, assignedBy, assignedByEmail, assignedAt }
          createdAt: new Date(),
          createdBy: createdBy || "Unknown",
          createdByEmail: createdByEmail || "",
          updatedAt: new Date(),
          updatedBy: updatedBy || createdBy || "Unknown",
          updatedByEmail: updatedByEmail || createdByEmail || "",
        };

        const result = await db
          .collection("longleadpackages")
          .insertOne(packageData);

        return res.status(201).json({
          success: true,
          _id: result.insertedId,
          ...packageData,
        });
      }

      case "PUT": {
        const {
          _id,
          packageName,
          packageDescription,
          dateSharedFromDesigner,
          dateSharedToMMDByProject,
          dateRFQFloated,
          dateOffersSharedWithProject,
          poDate,
          packageDocuments,
          poNumbers,
          updatedBy,
          updatedByEmail,
          poAssignmentMetadata,
        } = req.body;

        if (!_id) {
          return res.status(400).json({ error: "Package ID is required" });
        }

        const updateData = {
          updatedAt: new Date(),
        };

        if (updatedBy !== undefined) {
          updateData.updatedBy = updatedBy || "Unknown";
          updateData.updatedByEmail = updatedByEmail || "";
        }

        if (packageName !== undefined) updateData.packageName = packageName;
        if (packageDescription !== undefined)
          updateData.packageDescription = packageDescription;
        if (dateSharedFromDesigner !== undefined)
          updateData.dateSharedFromDesigner = dateSharedFromDesigner || null;
        if (dateSharedToMMDByProject !== undefined)
          updateData.dateSharedToMMDByProject = dateSharedToMMDByProject || null;
        if (dateRFQFloated !== undefined)
          updateData.dateRFQFloated = dateRFQFloated || null;
        if (dateOffersSharedWithProject !== undefined)
          updateData.dateOffersSharedWithProject =
            dateOffersSharedWithProject || null;
        if (poDate !== undefined) updateData.poDate = poDate || null;
        if (packageDocuments !== undefined)
          updateData.packageDocuments = Array.isArray(packageDocuments)
            ? packageDocuments
            : [];
        if (poNumbers !== undefined || poAssignmentMetadata !== undefined) {
          // Get existing package to access poAssignments array
          const existingPackage = await db
            .collection("longleadpackages")
            .findOne({ _id: new ObjectId(_id) });
          
          const existingAssignments = existingPackage?.poAssignments || [];
          
          if (poAssignmentMetadata) {
            // New PO assignment - add to assignments array
            const newAssignment = {
              poNumber: poAssignmentMetadata.poNumber,
              assignedBy: poAssignmentMetadata.assignedBy || "Unknown",
              assignedByEmail: poAssignmentMetadata.assignedByEmail || "",
              assignedAt: poAssignmentMetadata.assignedAt || new Date().toISOString(),
            };
            
            // Check if PO already exists, if so replace it, otherwise add it
            const existingIndex = existingAssignments.findIndex(
              a => a.poNumber === poAssignmentMetadata.poNumber
            );
            
            if (existingIndex >= 0) {
              // Update existing assignment
              existingAssignments[existingIndex] = newAssignment;
              updateData.poAssignments = existingAssignments;
            } else {
              // Add new assignment
              updateData.poAssignments = [...existingAssignments, newAssignment];
            }
          } else if (poNumbers !== undefined) {
            // If poNumbers array provided but no metadata, sync assignments with poNumbers
            // Keep existing assignments for POs that are still in the list
            updateData.poAssignments = existingAssignments.filter(
              assignment => poNumbers.includes(assignment.poNumber)
            );
          }
        }

        const result = await db
          .collection("longleadpackages")
          .updateOne({ _id: new ObjectId(_id) }, { $set: updateData });

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Package not found" });
        }

        return res.json({
          success: true,
          message: "Package updated successfully",
        });
      }

      case "DELETE": {
        const { _id } = req.query;

        if (!_id) {
          return res.status(400).json({ error: "Package ID is required" });
        }

        const result = await db
          .collection("longleadpackages")
          .deleteOne({ _id: new ObjectId(_id) });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Package not found" });
        }

        return res.json({
          success: true,
          message: "Package deleted successfully",
        });
      }

      default:
        return res.status(405).json({ error: "Method not supported" });
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

export default handler;
