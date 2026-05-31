import { connectToDatabase } from "../../../lib/mongoconnect";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  // Dynamic host detection to prevent NEXTAUTH_URL mismatches and localhost resolution errors
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  let host = req.headers['x-forwarded-host'] || req.headers.host || '127.0.0.1:3000';
  if (host.startsWith('localhost')) {
    host = host.replace('localhost', '127.0.0.1');
  }
  process.env.NEXTAUTH_URL = `${protocol}://${host}`;

  // 1. Session and Role Authorization Check
  const session = await getServerSession(req, res, authOptions);
  if (!session || session?.user?.role !== "admin") {
    return res.status(403).json({ error: "Access Denied. Administrator role required." });
  }

  const { type } = req.query;

  // Define collection mapping based on type
  const collectionMap = {
    'networks': 'networks',
  };

  const collectionName = collectionMap[type];

  if (!collectionName) {
    return res.status(404).json({ error: "Master type not found" });
  }

  try {
    const { db } = await connectToDatabase();
    
    switch (req.method) {
      case "GET": {
        let query = {};
        const limit = parseInt(req.query.limit || "50", 10);
        const skip = parseInt(req.query.skip || "0", 10);
        const search = req.query.search || "";
        
        if (search) {
          query = {
            $or: [
              { 'network-num': { $regex: search, $options: "i" } },
              { 'project-wbs': { $regex: search, $options: "i" } },
              { 'project-name': { $regex: search, $options: "i" } },
            ]
          };
        }

        if (req.query.export === 'true') {
          const data = await db.collection(collectionName)
            .find(query)
            .sort({ 'network-num': 1 })
            .toArray();
          return res.status(200).json({ data });
        }

        const total = await db.collection(collectionName).countDocuments(query);
        const data = await db.collection(collectionName)
          .find(query)
          .sort({ 'network-num': 1 })
          .skip(skip)
          .limit(limit)
          .toArray();

        return res.status(200).json({
          data,
          total,
          hasMore: skip + data.length < total
        });
      }

      case "POST": {
        if (req.body.bulk === true) {
          const bulkData = req.body.data || [];
          if (!Array.isArray(bulkData)) {
            return res.status(400).json({ error: "Data must be an array" });
          }

          const keyFieldsMap = {
            'networks': ['network-num'],
          };

          const keys = keyFieldsMap[type] || ['name'];
          const bulkOps = bulkData.map(row => {
            const querySelector = {};
            keys.forEach(k => {
              querySelector[k] = row[k];
            });

            const updateFields = { ...row, updatedAt: new Date() };
            delete updateFields._id;

            // Handle date parsing and default to today's date if empty
            if (updateFields['created-date']) {
              const parsedDate = new Date(updateFields['created-date']);
              if (!isNaN(parsedDate.getTime())) {
                updateFields['created-date'] = parsedDate;
              } else {
                updateFields['created-date'] = new Date();
              }
            } else {
              updateFields['created-date'] = new Date();
            }

            return {
              updateOne: {
                filter: querySelector,
                update: {
                  $set: updateFields,
                  $setOnInsert: { createdAt: new Date() }
                },
                upsert: true
              }
            };
          });

          if (bulkOps.length === 0) {
            return res.status(200).json({ message: "No records to import" });
          }

          const bulkResult = await db.collection(collectionName).bulkWrite(bulkOps);
          return res.status(200).json({
            message: "Bulk import completed",
            matchedCount: bulkResult.matchedCount,
            modifiedCount: bulkResult.modifiedCount,
            upsertedCount: bulkResult.upsertedCount,
          });
        }

        // Single Insert
        const insertData = { ...req.body, createdAt: new Date() };
        
        // Parse single created-date field
        if (insertData['created-date']) {
          const parsedDate = new Date(insertData['created-date']);
          if (!isNaN(parsedDate.getTime())) {
            insertData['created-date'] = parsedDate;
          } else {
            insertData['created-date'] = new Date();
          }
        } else {
          insertData['created-date'] = new Date();
        }

        const insertResult = await db.collection(collectionName).insertOne(insertData);
        return res.status(201).json({ _id: insertResult.insertedId, ...insertData });
      }

      case "PUT": {
        const { _id, ...updateFields } = req.body;
        if (!_id) return res.status(400).json({ error: "ID is required" });
        
        const updateData = { ...updateFields, updatedAt: new Date() };
        
        // Parse single created-date field
        if (updateData['created-date']) {
          const parsedDate = new Date(updateData['created-date']);
          if (!isNaN(parsedDate.getTime())) {
            updateData['created-date'] = parsedDate;
          } else {
            updateData['created-date'] = new Date();
          }
        } else {
          updateData['created-date'] = new Date();
        }

        const updateResult = await db.collection(collectionName).updateOne(
          { _id: new ObjectId(_id) },
          { $set: updateData }
        );
        
        return res.status(200).json({ _id, ...updateData, updateResult });
      }

      case "DELETE": {
        const idToDelete = req.query.id || req.body._id;
        if (!idToDelete) return res.status(400).json({ error: "ID is required" });

        const deleteResult = await db.collection(collectionName).deleteOne({
          _id: new ObjectId(idToDelete)
        });
        return res.status(200).json(deleteResult);
      }

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error(`Error in Data Load ${type} API:`, error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
