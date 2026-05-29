import { connectToDatabase } from "../../../../lib/mongoconnect";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const { type } = req.query;

  // Define collection mapping based on type
  const collectionMap = {
    'locations': 'asset_locations',
    'locationcities': 'asset_locationcities',
    'departments': 'asset_departments',
    'designations': 'asset_designations',
    'fixed-asset-categories': 'asset_FIXED_ASSET_CATEGORIES',
    'fixed-asset-subcategories': 'asset_FIXED_ASSET_SUBCATEGORIES',
    'fixed-asset-manufacturers': 'asset_FIXED_ASSET_MANUFACTURERS',
    'mme-categories': 'asset_MME_CATEGORIES',
    'mme-subcategories': 'asset_MME_SUBCATEGORIES',
    'mme-manufacturers': 'asset_MME_MANUFACTURERS',
  };

  const collectionName = collectionMap[type];

  if (!collectionName) {
    return res.status(404).json({ error: "Master type not found" });
  }

  try {
    const { db } = await connectToDatabase();
    
    switch (req.method) {
      case "GET":
        let query = {};
        if ((type === 'fixed-asset-subcategories' || type === 'mme-subcategories') && req.query.category) {
            query.category = req.query.category;
        }
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

        const data = await db.collection(collectionName).find(query).sort({ name: 1, locationName: 1 }).toArray();
        return res.status(200).json(data);

      case "POST": {
        if (req.body.bulk === true) {
          const bulkData = req.body.data || [];
          if (!Array.isArray(bulkData)) {
            return res.status(400).json({ error: "Data must be an array" });
          }

          const keyFieldsMap = {
            'fixed-asset-categories': ['name'],
            'fixed-asset-subcategories': ['category', 'name'],
            'fixed-asset-manufacturers': ['name'],
            'mme-categories': ['name'],
            'mme-subcategories': ['category', 'name'],
            'mme-manufacturers': ['name'],
            'locations': ['locationName'],
            'locationcities': ['name', 'kind'],
            'departments': ['name'],
            'designations': ['name'],
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
    console.error(`Error in ${type} API:`, error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
