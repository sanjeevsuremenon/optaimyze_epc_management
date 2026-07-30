import { connectToDatabase } from "../../../lib/mongoconnect";
import { ObjectId, Decimal128 } from "mongodb";
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
    'projects': 'projects',
    'wbs': 'wbsdescriptions',
    'materials': 'materials',
    'materialgroups': 'materialsubgroups', // Maps to materialsubgroups collection
    'mattypes': 'materialgroups', // Maps to materialgroups collection
    'vendors': 'vendors',
    'purchaseorders': 'purchaseorders',
    'specialstock': 'specialstock',
    'completestock': 'completestock',
  };

  const collectionName = collectionMap[type];

  if (!collectionName) {
    return res.status(404).json({ error: "Master type not found" });
  }

  const sortFieldsMap = {
    'networks': 'network-num',
    'projects': 'project-wbs',
    'wbs': 'wbs-number',
    'materials': 'material-code',
    'materialgroups': 'name',
    'mattypes': 'name',
    'vendors': 'vendor-code',
    'purchaseorders': 'po-number',
    'specialstock': 'material-code',
    'completestock': 'material-code',
  };
  const sortField = sortFieldsMap[type] || '_id';

  // Helper to parse date fields safely
  const parseDates = (doc) => {
    const dateFields = [
      'created-date', 'changed-date', 'start-date', 'finished-date',
      'updated-at', 'updated-date', 'created_date', 'createdAt', 'updatedAt',
      'po-date', 'delivery-date', 'stock-date'
    ];
    dateFields.forEach(field => {
      if (doc[field]) {
        let rawDate = doc[field];
        if (rawDate && typeof rawDate === 'object' && rawDate.$date) {
          rawDate = rawDate.$date;
        }
        const parsedDate = new Date(rawDate);
        if (!isNaN(parsedDate.getTime())) {
          doc[field] = parsedDate;
        } else {
          delete doc[field];
        }
      }
    });
    return doc;
  };

  // Helper to unflatten dot notation strings into nested objects (e.g. address.city -> address: { city: ... })
  const unflattenDotNotation = (row) => {
    const result = {};
    Object.keys(row).forEach(key => {
      const parts = key.split('.');
      if (parts.length > 1) {
        let current = result;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
        current[parts[parts.length - 1]] = row[key];
      } else {
        result[key] = row[key];
      }
    });
    return result;
  };

  // Helper to parse specific number/decimal fields
  const parseNumericTypes = (doc, type) => {
    if (type === 'purchaseorders') {
      const numberFields = ['po-unit-price', 'po-value-sar', 'pending-val-sar', 'pending-inv-val'];
      numberFields.forEach(field => {
        if (doc[field] !== undefined && doc[field] !== null && doc[field] !== '') {
          doc[field] = parseFloat(String(doc[field]).replace(/,/g, ''));
        }
      });
      const decimalFields = ['po-quantity', 'pending-qty', 'pending-inv-qty'];
      decimalFields.forEach(field => {
        if (doc[field] !== undefined && doc[field] !== null && doc[field] !== '') {
          try {
            doc[field] = Decimal128.fromString(String(doc[field]).replace(/,/g, ''));
          } catch (e) {
            doc[field] = parseFloat(String(doc[field]).replace(/,/g, ''));
          }
        }
      });
    } else if (type === 'specialstock' || type === 'completestock') {
      const numberFields = ['stock-val', 'receipt-val', 'issue-val', 'current-stkval'];
      numberFields.forEach(field => {
        if (doc[field] !== undefined && doc[field] !== null && doc[field] !== '') {
          doc[field] = parseFloat(String(doc[field]).replace(/,/g, ''));
        }
      });
      const decimalFields = ['stock-qty', 'receipt-qty', 'issue-qty', 'current-stkqty'];
      decimalFields.forEach(field => {
        if (doc[field] !== undefined && doc[field] !== null && doc[field] !== '') {
          try {
            doc[field] = Decimal128.fromString(String(doc[field]).replace(/,/g, ''));
          } catch (e) {
            doc[field] = parseFloat(String(doc[field]).replace(/,/g, ''));
          }
        }
      });
    }
    return doc;
  };

  try {
    const { db } = await connectToDatabase();
    
    switch (req.method) {
      case "GET": {
        let query = {};
        const limit = parseInt(req.query.limit || "50", 10);
        const skip = parseInt(req.query.skip || "0", 10);
        const search = req.query.search || "";
        
        if (search) {
          if (type === 'networks') {
            query = {
              $or: [
                { 'network-num': { $regex: search, $options: "i" } },
                { 'project-wbs': { $regex: search, $options: "i" } },
                { 'project-name': { $regex: search, $options: "i" } },
              ]
            };
          } else if (type === 'projects') {
            query = {
              $or: [
                { 'project-wbs': { $regex: search, $options: "i" } },
                { 'project-name': { $regex: search, $options: "i" } },
                { 'project-incharge': { $regex: search, $options: "i" } },
              ]
            };
          } else if (type === 'wbs') {
            query = {
              $or: [
                { 'wbs-number': { $regex: search, $options: "i" } },
                { 'wbs-description': { $regex: search, $options: "i" } },
              ]
            };
          } else if (type === 'materials') {
            query = {
              $or: [
                { 'material-code': { $regex: search, $options: "i" } },
                { 'material-description': { $regex: search, $options: "i" } },
                { 'material-group': { $regex: search, $options: "i" } },
                { 'old-material-number': { $regex: search, $options: "i" } },
              ]
            };
          } else if (type === 'materialgroups') {
            query = {
              $or: [
                { 'name': { $regex: search, $options: "i" } },
                { 'description': { $regex: search, $options: "i" } },
              ]
            };
          } else if (type === 'mattypes') {
            query = {
              $or: [
                { 'name': { $regex: search, $options: "i" } },
                { 'description': { $regex: search, $options: "i" } },
              ]
            };
          } else if (type === 'vendors') {
            query = {
              $or: [
                { 'vendor-code': { $regex: search, $options: "i" } },
                { 'vendor-name': { $regex: search, $options: "i" } },
                { 'vat-number': { $regex: search, $options: "i" } },
              ]
            };
          } else if (type === 'purchaseorders') {
            query = {
              $or: [
                { 'po-number': { $regex: search, $options: "i" } },
                { 'vendorname': { $regex: search, $options: "i" } },
                { 'vendorcode': { $regex: search, $options: "i" } },
                { 'material.matcode': { $regex: search, $options: "i" } },
                { 'material.matdescription': { $regex: search, $options: "i" } },
              ]
            };
          } else if (type === 'specialstock' || type === 'completestock') {
            query = {
              $or: [
                { 'material-code': { $regex: search, $options: "i" } },
                { 'plant-code': { $regex: search, $options: "i" } },
                { 'wbs-element': { $regex: search, $options: "i" } },
              ]
            };
          }
        }

        if (req.query.export === 'true') {
          const data = await db.collection(collectionName)
            .find(query)
            .sort({ [sortField]: 1 })
            .toArray();
          return res.status(200).json({ data });
        }

        const total = await db.collection(collectionName).countDocuments(query);
        const data = await db.collection(collectionName)
          .find(query)
          .sort({ [sortField]: 1 })
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
            'projects': ['project-wbs'],
            'wbs': ['wbs-number'],
            'materials': ['material-code'],
            'materialgroups': ['name'],
            'mattypes': ['name'],
            'vendors': ['vendor-code'],
            'purchaseorders': ['po-number', 'po-line-item'],
            'specialstock': ['material-code', 'plant-code', 'wbs-element'],
            'completestock': ['material-code', 'plant-code'],
          };

          const keys = keyFieldsMap[type] || ['_id'];
          const bulkOps = bulkData.map(row => {
            const querySelector = {};
            // If the query key is nested (e.g. material.matcode), fetch it from the expanded object or string path
            keys.forEach(k => {
              querySelector[k] = row[k];
            });

            // Expand dot-notation flat properties (e.g. address.city -> address: { city: ... })
            let updateFields = unflattenDotNotation(row);
            delete updateFields._id;

            // Parse numeric / decimal types
            updateFields = parseNumericTypes(updateFields, type);

            // Parse all date fields
            updateFields = parseDates(updateFields);

            // Convert groupId to ObjectId for materialsubgroups (materialgroups tab)
            if (type === 'materialgroups' && updateFields['groupId'] && typeof updateFields['groupId'] === 'string' && updateFields['groupId'].length === 24) {
              try {
                updateFields['groupId'] = new ObjectId(updateFields['groupId']);
              } catch (e) {
                // Ignore parsing errors
              }
            }

            // Convert isService string to boolean if present
            if (updateFields['isService'] !== undefined) {
              updateFields['isService'] = String(updateFields['isService']).toLowerCase() === 'true';
            }

            // Default dates if missing
            if (type === 'projects' || type === 'networks') {
              if (!updateFields['created-date']) {
                updateFields['created-date'] = new Date();
              }
            } else if (type === 'wbs') {
              if (!updateFields['updated-at']) {
                updateFields['updated-at'] = new Date();
              }
            } else if (type === 'materials') {
              if (!updateFields['updated-date']) {
                updateFields['updated-date'] = new Date();
              }
              if (!updateFields['created_date']) {
                updateFields['created_date'] = new Date();
              }
            } else if (type === 'materialgroups' || type === 'mattypes') {
              if (!updateFields['updatedAt']) {
                updateFields['updatedAt'] = new Date();
              }
              if (!updateFields['createdAt']) {
                updateFields['createdAt'] = new Date();
              }
            } else if (type === 'vendors') {
              if (!updateFields['created_date']) {
                updateFields['created_date'] = new Date();
              }
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
        let insertData = { ...req.body, createdAt: new Date() };
        insertData = unflattenDotNotation(insertData);
        insertData = parseNumericTypes(insertData, type);
        insertData = parseDates(insertData);
        
        if (type === 'materialgroups' && insertData['groupId'] && typeof insertData['groupId'] === 'string' && insertData['groupId'].length === 24) {
          try {
            insertData['groupId'] = new ObjectId(insertData['groupId']);
          } catch (e) {}
        }
        if (insertData['isService'] !== undefined) {
          insertData['isService'] = String(insertData['isService']).toLowerCase() === 'true';
        }

        const insertResult = await db.collection(collectionName).insertOne(insertData);
        return res.status(201).json({ _id: insertResult.insertedId, ...insertData });
      }

      case "PUT": {
        const { _id, ...updateFields } = req.body;
        if (!_id) return res.status(400).json({ error: "ID is required" });
        
        let updateData = { ...updateFields, updatedAt: new Date() };
        updateData = unflattenDotNotation(updateData);
        updateData = parseNumericTypes(updateData, type);
        updateData = parseDates(updateData);

        if (type === 'materialgroups' && updateData['groupId'] && typeof updateData['groupId'] === 'string' && updateData['groupId'].length === 24) {
          try {
            updateData['groupId'] = new ObjectId(updateData['groupId']);
          } catch (e) {}
        }
        if (updateData['isService'] !== undefined) {
          updateData['isService'] = String(updateData['isService']).toLowerCase() === 'true';
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
