import { connectToDatabase } from "../../../lib/mongoconnect";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const { type } = req.query;

  // Define collection mapping based on type
  const collectionMap = {
    'employees': 'employees',
    'designations': 'asset_designations',        // Shared collection
    'departments': 'asset_departments',          // Shared collection
    'locations': 'asset_locations',              // Shared collection
    'locationcities': 'asset_locationcities',    // Shared collection
    'employee-grades': 'global_employee_grades',
    'employee-salary-levels': 'global_employee_salary_levels',
    'equipment-types': 'global_equipment_types',
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
        if (type === 'locations' && req.query.premisesKind) {
          if (req.query.premisesKind === 'warehouse') {
            query.premisesKind = 'warehouse';
          } else if (req.query.premisesKind === 'department') {
            query.$or = [
              { premisesKind: 'department' },
              { premisesKind: { $exists: false } },
              { premisesKind: null },
            ];
          }
        }

        if (type === 'employees') {
          const limit = parseInt(req.query.limit || "50", 10);
          const skip = parseInt(req.query.skip || "0", 10);
          const search = req.query.search || "";
          
          if (search) {
            query = {
              $or: [
                { empname: { $regex: search, $options: "i" } },
                { empno: { $regex: search, $options: "i" } },
              ]
            };
          }

          if (req.query.export === 'true') {
            const data = await db.collection(collectionName)
              .find(query)
              .sort({ empname: 1 })
              .toArray();
            return res.status(200).json({ data });
          }

          const total = await db.collection(collectionName).countDocuments(query);
          const data = await db.collection(collectionName)
            .find(query)
            .sort({ empname: 1 })
            .skip(skip)
            .limit(limit)
            .toArray();

          return res.status(200).json({
            data,
            total,
            hasMore: skip + data.length < total
          });
        }

        let sortQuery = { name: 1 };
        if (type === 'locations') sortQuery = { locationName: 1 };
        if (type === 'employee-grades') sortQuery = { grade: 1 };
        if (type === 'employee-salary-levels') sortQuery = { level: 1 };

        const data = await db.collection(collectionName).find(query).sort(sortQuery).toArray();
        return res.status(200).json(data);
      }

      case "POST": {
        if (req.body.bulk === true) {
          const bulkData = req.body.data || [];
          if (!Array.isArray(bulkData)) {
            return res.status(400).json({ error: "Data must be an array" });
          }

          const keyFieldsMap = {
            'employees': ['empno'],
            'designations': ['name'],
            'departments': ['name'],
            'locations': ['locationName'],
            'locationcities': ['name', 'kind'],
            'employee-grades': ['grade'],
            'employee-salary-levels': ['level'],
            'equipment-types': ['name'],
          };

          const keys = keyFieldsMap[type] || ['name'];
          const bulkOps = bulkData.map(row => {
            const querySelector = {};
            keys.forEach(k => {
              querySelector[k] = row[k];
            });

            const updateFields = { ...row, updatedAt: new Date() };
            delete updateFields._id;

            if (type === 'departments' || type === 'locationcities') {
              updateFields.nameKey = (updateFields.name || '').trim().toLowerCase();
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

        const insertData = { ...req.body, createdAt: new Date() };
        if (type === 'departments' || type === 'locationcities') {
          insertData.nameKey = (insertData.name || '').trim().toLowerCase();
        }
        const insertResult = await db.collection(collectionName).insertOne(insertData);
        return res.status(201).json({ _id: insertResult.insertedId, ...insertData });
      }

      case "PUT": {
        const { _id, ...updateFields } = req.body;
        if (!_id) return res.status(400).json({ error: "ID is required" });
        
        const updateData = { ...updateFields, updatedAt: new Date() };
        if (type === 'departments' || type === 'locationcities') {
          updateData.nameKey = (updateData.name || '').trim().toLowerCase();
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
    console.error(`Error in Global Masters ${type} API:`, error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
