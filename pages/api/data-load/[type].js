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
    'poupdates': 'poupdates',
    'poexecution': 'poexecution',
    'vendorupdates': 'vendorupdates',
    'vendorevaluations': 'vendorevaluations',
    'vendorprequalifications': 'vendorprequalifications',
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
    'poupdates': 'ponumber',
    'poexecution': 'ponumber',
    'vendorupdates': 'vendorname',
    'vendorevaluations': 'vendorCode',
    'vendorprequalifications': 'vendorCode',
  };
  const sortField = sortFieldsMap[type] || '_id';

  // Helper to parse date fields safely
  const parseDates = (doc) => {
    const parseDatesDeep = (obj) => {
      if (Array.isArray(obj)) {
        obj.forEach(item => parseDatesDeep(item));
      } else if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
          let val = obj[key];
          if (val && typeof val === 'object' && val.$date) {
            obj[key] = new Date(val.$date);
          } else if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
            const parsedDate = new Date(val);
            if (!isNaN(parsedDate.getTime())) {
              obj[key] = parsedDate;
            }
          } else if (
            typeof val === 'string' &&
            val.match(/^\d{4}-\d{2}-\d{2}$/) &&
            (key.endsWith('-date') || key.endsWith('Date') || key === 'updated-at' || key === 'updatedAt' || key === 'createdAt')
          ) {
            const parsedDate = new Date(`${val}T00:00:00.000Z`);
            if (!isNaN(parsedDate.getTime())) {
              obj[key] = parsedDate;
            }
          } else if (typeof val === 'object') {
            parseDatesDeep(val);
          }
        });
      }
    };
    parseDatesDeep(doc);
    return doc;
  };

  // Normalize network activities: [{ activity-number, activity-wbs }, ...]
  // Maps each activity to a child "Activity WBS" under the root project-wbs (not the root itself).
  const normalizeNetworkActivities = (doc) => {
    if (!doc) return doc;

    const toItem = (activityNumber, activityWbs) => {
      const num = String(activityNumber || "").trim();
      const wbs = String(activityWbs || "").trim();
      if (!num && !wbs) return null;
      return { "activity-number": num, "activity-wbs": wbs };
    };

    let items = [];
    const raw = doc.activities ?? doc["activity-numbers"] ?? doc["activity-number"];

    if (Array.isArray(raw)) {
      raw.forEach((entry) => {
        if (entry && typeof entry === "object" && !Array.isArray(entry)) {
          const item = toItem(
            entry["activity-number"] ?? entry.activityNumber,
            entry["activity-wbs"] ?? entry.activityWbs
          );
          if (item) items.push(item);
        } else if (typeof entry === "string") {
          const [a, b] = String(entry).split(":").map((s) => s.trim());
          const item = toItem(a, b || "");
          if (item) items.push(item);
        }
      });
    } else if (typeof raw === "string" && raw.trim()) {
      raw
        .split(/[;\n|]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((part) => {
          const [a, b] = part.split(":").map((s) => s.trim());
          const item = toItem(a, b || "");
          if (item) items.push(item);
        });
    }

    const seen = new Set();
    items = items.filter((item) => {
      const key = `${item["activity-number"]}|${item["activity-wbs"]}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    doc.activities = items;
    doc["activity-numbers"] = items.map((a) => a["activity-number"]).filter(Boolean);
    doc["activity-number"] = doc["activity-numbers"].join("; ");
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
    } else if (type === 'poexecution') {
      const numberFields = ['abgamount', 'pbgamount', 'lcamount', 'amount', 'advamountpaid', 'milestoneamountpaid', 'finalpaidamt'];
      const parseNumbersDeep = (obj) => {
        if (Array.isArray(obj)) {
          obj.forEach(item => parseNumbersDeep(item));
        } else if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(key => {
            let val = obj[key];
            if (numberFields.includes(key) && val !== undefined && val !== null && val !== '') {
              obj[key] = parseFloat(String(val).replace(/,/g, ''));
            } else if (typeof val === 'object') {
              parseNumbersDeep(val);
            }
          });
        }
      };
      parseNumbersDeep(doc);
    } else if (type === 'vendorevaluations') {
      if (doc['starRating'] !== undefined && doc['starRating'] !== null && doc['starRating'] !== '') {
        doc['starRating'] = parseFloat(String(doc['starRating']));
      }
      ['ratingMaterials', 'ratingServices'].forEach(field => {
        if (doc[field] && typeof doc[field] === 'object') {
          Object.keys(doc[field]).forEach(k => {
            if (doc[field][k] !== undefined && doc[field][k] !== null && doc[field][k] !== '') {
              doc[field][k] = parseFloat(String(doc[field][k]));
            }
          });
        }
      });
    } else if (type === 'vendorprequalifications') {
      const numberFields = ['numEmployees', 'numSkilledLabor', 'numTechnicalStaff', 'numUnskilledLabor', 'totalAreaSqm'];
      numberFields.forEach(field => {
        if (doc[field] !== undefined && doc[field] !== null && doc[field] !== '') {
          doc[field] = parseFloat(String(doc[field]).replace(/,/g, ''));
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
                { 'activity-number': { $regex: search, $options: "i" } },
                { 'activity-numbers': { $regex: search, $options: "i" } },
                { 'activities.activity-number': { $regex: search, $options: "i" } },
                { 'activities.activity-wbs': { $regex: search, $options: "i" } },
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
                { 'network-num': { $regex: search, $options: "i" } },
                { 'activity-number': { $regex: search, $options: "i" } },
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
          } else if (type === 'vendorupdates') {
            query = {
              $or: [
                { 'vendorname': { $regex: search, $options: "i" } },
                { 'vendorcode': { $regex: search, $options: "i" } },
                { 'vendorCode': { $regex: search, $options: "i" } },
                { 'title': { $regex: search, $options: "i" } },
              ]
            };
          } else if (type === 'vendorevaluations' || type === 'vendorprequalifications') {
            query = {
              $or: [
                { 'vendorCode': { $regex: search, $options: "i" } },
                { 'vendorName': { $regex: search, $options: "i" } },
                { 'vendor-code': { $regex: search, $options: "i" } },
                { 'vendor-name': { $regex: search, $options: "i" } },
              ]
            };
          } else if (type === 'poupdates' || type === 'poexecution') {
            query = {
              $or: [
                { 'ponumber': { $regex: search, $options: "i" } },
                { 'title': { $regex: search, $options: "i" } },
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

          // For networks bulk import: only allow rows whose project-wbs exists in projects
          let projectWbsSet = null;
          if (type === 'networks') {
            const existingProjects = await db.collection('projects').find({}, { projection: { 'project-wbs': 1, 'project-name': 1 } }).toArray();
            projectWbsSet = new Map(existingProjects.map((p) => [p['project-wbs'], p['project-name'] || '']));
          }

          const skippedMissingProjects = [];
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

            if (type === 'networks') {
              updateFields = normalizeNetworkActivities(updateFields);
              const projectWbs = String(updateFields['project-wbs'] || '').trim();
              if (!projectWbs || !projectWbsSet.has(projectWbs)) {
                skippedMissingProjects.push(projectWbs || '(empty)');
                return null;
              }
              updateFields['project-name'] = projectWbsSet.get(projectWbs) || updateFields['project-name'] || '';
            }

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
          }).filter(Boolean);

          if (bulkOps.length === 0) {
            const skipMsg = skippedMissingProjects?.length
              ? ` All ${skippedMissingProjects.length} network row(s) skipped — project-wbs not found in projects collection.`
              : "";
            return res.status(400).json({
              error: `No records to import.${skipMsg}`,
              skippedMissingProjects: skippedMissingProjects || [],
            });
          }

          const bulkResult = await db.collection(collectionName).bulkWrite(bulkOps);
          return res.status(200).json({
            message: "Bulk import completed",
            matchedCount: bulkResult.matchedCount,
            modifiedCount: bulkResult.modifiedCount,
            upsertedCount: bulkResult.upsertedCount,
            skippedMissingProjects: skippedMissingProjects || [],
          });
        }

        // Single Insert
        let insertData = { ...req.body, createdAt: new Date() };
        insertData = unflattenDotNotation(insertData);
        insertData = parseNumericTypes(insertData, type);
        insertData = parseDates(insertData);
        if (type === 'networks') {
          insertData = normalizeNetworkActivities(insertData);
          const projectWbs = String(insertData['project-wbs'] || '').trim();
          if (!projectWbs) {
            return res.status(400).json({ error: "project-wbs is required and must reference an existing project" });
          }
          const project = await db.collection('projects').findOne({ 'project-wbs': projectWbs });
          if (!project) {
            return res.status(400).json({
              error: `Project "${projectWbs}" does not exist. Create it under Projects first before linking a network.`,
            });
          }
          insertData['project-name'] = project['project-name'] || insertData['project-name'] || '';
        }
        
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
        if (type === 'networks') {
          updateData = normalizeNetworkActivities(updateData);
          const projectWbs = String(updateData['project-wbs'] || '').trim();
          if (projectWbs) {
            const project = await db.collection('projects').findOne({ 'project-wbs': projectWbs });
            if (!project) {
              return res.status(400).json({
                error: `Project "${projectWbs}" does not exist. Create it under Projects first before linking a network.`,
              });
            }
            updateData['project-name'] = project['project-name'] || updateData['project-name'] || '';
          }
        }

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
