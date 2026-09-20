/**
 * Read-ONLY MongoDB query executor for the Optaimyze DB Agent.
 *
 * Mirrors the SmartTags (scanitsimple) AI-agent design:
 *   - an LLM proposes a "SafeQueryPlan" JSON (collection + operation + args)
 *   - this module VALIDATES the plan (read-only, allow-listed collections,
 *     forbidden aggregation stages rejected)
 *   - the plan is executed through the standard MongoDB Node driver
 *
 * Deployment note: the same code works against BOTH a locally deployed
 * MongoDB (mongodb://localhost:27017/...) and MongoDB Atlas
 * (mongodb+srv://...), because the official driver transparently supports
 * both via MONGODB_URI / DB_NAME in .env. No code change is needed when
 * switching between local and Atlas.
 */

import { ObjectId, Decimal128 } from 'mongodb';
import { connectToDatabase } from '../mongoconnect';

// ---------------------------------------------------------------------------
// Database schema description injected into the LLM prompt
// ---------------------------------------------------------------------------
export const DATABASE_SCHEMA_PROMPT = `
You are connected to the MongoDB database "${process.env.DB_NAME || 'mmportaloptaimyze'}" for "Optaimyze" - an EPC (Engineering, Procurement & Construction) Material & Vendor Management portal.

Here is the database schema, collections, and field definitions:

1. 'purchaseorders' (PO line items; one document per PO line):
   - 'po-number' (string, e.g. "4600000460")
   - 'po-line-item' (string, e.g. "10")
   - vendorcode (string, e.g. "100196")
   - vendorname (string, vendor display name)
   - 'po-date' (string or Date, purchase order date)
   - currency (string, e.g. "USD", "SAR")
   - 'po-unit-price' (number)
   - 'po-value-sar' (number, PO line value in SAR)
   - 'po-quantity' (string or number, ordered quantity)
   - 'po-unit-of-measure' (string, e.g. "LOT", "EA")
   - 'delivery-date' (string or Date)
   - 'pending-qty' / 'pending-val-sar' (string/number, pending delivery)
   - 'pending-inv-qty' / 'pending-inv-val' (string/number, pending invoice)
   - 'plant-code' (string, e.g. "1100")
   - material (object): { matcode (string), matdescription (string), matgroup (string, e.g. "EM08") }
   - account (object): { wbs (string, e.g. "ED/SC.21.001.01"), network (string, e.g. "4004923") }
   - createdAt (Date, record creation timestamp)

2. 'vendors' (Registered vendor master):
   - 'vendor-code' (string, e.g. "201222")
   - 'vendor-name' (string)
   - 'vat-number' (string)
   - created_by (string, employee number)
   - created_date (Date)
   - address (object): { countrycode, city, street, district, pobox, zipcode }
   - contact (object): { telelphone1, telephone2, fax }  (note: 'telelphone1' is spelled with an extra 'l' in the DB)

3. 'completestock' (Material stock summary per plant):
   - 'material-code' (string)
   - 'plant-code' (string)
   - 'stock-date' (Date)
   - 'current-stkqty' (Decimal128, current stock quantity)
   - 'current-stkval' (number, current stock value)
   - 'receipt-qty' / 'receipt-val' (Decimal128 / number, total receipts)
   - 'issue-qty' / 'issue-val' (Decimal128 / number, total issues)
   - 'unit-of-measure' (string, e.g. "EA")

4. 'specialstock' (Project/WBS special stock):
   - 'material-code' (string)
   - 'plant-code' (string)
   - 'wbs-element' (string, e.g. "ED/PI.16.002.01")
   - 'stk-indicator' (string, e.g. "Q")
   - 'stock-qty' (Decimal128)
   - 'stock-val' (number)
   - 'unit-of-measure' (string)
   - 'stock-date' (Date)
   - 'sales-doc' / 'sales-doc-no' (string)

5. 'projects' (Project master):
   - 'project-wbs' (string, e.g. "IS/GP.20.009")
   - 'project-name' (string)
   - 'project-incharge' (string, person in charge)
   - 'start-date' (Date)
   - 'finished-date' (Date)
   - 'created-date' / 'changed-date' (Date)

6. 'networks' (Project network activities):
   - 'network-num' (string, e.g. "100001")
   - 'project-wbs' (string)
   - 'project-name' (string)
   - 'created-date' (Date)
   - 'created-by' (string)

7. 'vendorevaluations' (Vendor ratings & feedback):
   - vendorCode (string)
   - vendorName (string)
   - tier (string, e.g. "top tier", "middle tier")
   - starRating (number, 0-5)
   - ratingMaterials (object, category key -> 1-5 score)
   - ratingServices (object or null)
   - comment (string, evaluator review text)
   - userId (string, evaluator email)
   - username (string)
   - createdAt (Date)

8. 'asset_locationcities' (Master list of cities / locations):
   - name (string, e.g. "Jubail")
   - nameKey (string, lowercase key)
   - kind (string, e.g. "warehouse")

9. 'materialgroups' (Material group master): fields vary, commonly { matgroup, description }
10. 'materialsubgroups' (Material subgroup master): fields vary, commonly { matsubgroup, matgroup, description }
11. 'nonsapvendors' (Non-SAP vendor list): fields vary, commonly { vendorcode, vendorname }
12. 'lessons_learnt' (Lessons learnt register): free-form fields
13. 'wbsdescriptions' (WBS description lookup): fields vary

Important field-naming notes:
- Many legacy fields use kebab-case strings with hyphens, e.g. 'po-number', 'po-value-sar', 'vendor-code'. You MUST quote them in JSON query plans.
- Numeric string fields (e.g. 'po-quantity', 'pending-qty') may be stored as strings; use $toDouble/$toDecimal conversions in aggregations when summing them.
- Decimal128 values serialize as { $numberDecimal: "217.00" } in JSON results.
`;

// ---------------------------------------------------------------------------
// Query plan validation (strictly read-only)
// ---------------------------------------------------------------------------

const FORBIDDEN_AGG_STAGES = new Set([
  '$out',
  '$merge',
  '$collStats',
  '$indexStats',
  '$planCacheStats',
]);

const ALLOWED_COLLECTIONS = new Set([
  'purchaseorders',
  'vendors',
  'vendorsdata',
  'vendorupdates',
  'completestock',
  'specialstock',
  'projects',
  'networks',
  'vendorevaluations',
  'vendorprequalifications',
  'asset_locationcities',
  'materialgroups',
  'materialsubgroups',
  'materials',
  'nonsapvendors',
  'lessons_learnt',
  'wbsdescriptions',
  'pocomments',
  'poschedule',
]);

export function validateQuerySafety(plan) {
  if (!plan || typeof plan !== 'object') {
    throw new Error('Invalid query plan: plan object missing');
  }

  if (!plan.collection || !ALLOWED_COLLECTIONS.has(plan.collection)) {
    throw new Error(`Invalid or unauthorized collection: "${plan.collection}"`);
  }

  if (plan.operation === 'aggregate') {
    if (!Array.isArray(plan.pipeline)) {
      throw new Error('Aggregation pipeline must be an array');
    }
    for (const stage of plan.pipeline) {
      if (typeof stage !== 'object' || stage === null) {
        throw new Error('Invalid stage in aggregation pipeline');
      }
      for (const key of Object.keys(stage)) {
        if (FORBIDDEN_AGG_STAGES.has(key)) {
          throw new Error(`Forbidden aggregation stage detected: ${key}`);
        }
      }
    }
  } else if (!['find', 'countDocuments', 'distinct'].includes(plan.operation)) {
    throw new Error(
      `Forbidden operation: "${plan.operation}". Only read operations (find, aggregate, countDocuments, distinct) are permitted.`
    );
  }
}

// ---------------------------------------------------------------------------
// BSON deserialization: ISO date strings / $date / $oid / $numberDecimal
// ---------------------------------------------------------------------------
export function deserializeBsonTypes(val) {
  if (val === null || val === undefined) return val;

  if (typeof val === 'string') {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z?)?$/;
    if (isoDateRegex.test(val)) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
    }
    return val;
  }

  if (Array.isArray(val)) {
    return val.map(deserializeBsonTypes);
  }

  if (typeof val === 'object') {
    if (val.$date) {
      const d = new Date(
        typeof val.$date === 'string'
          ? val.$date
          : val.$date.$numberLong
            ? Number(val.$date.$numberLong)
            : val.$date
      );
      if (!isNaN(d.getTime())) return d;
    }
    if (val.$oid && typeof val.$oid === 'string' && ObjectId.isValid(val.$oid)) {
      return new ObjectId(val.$oid);
    }
    if (val.$numberDecimal !== undefined) {
      try {
        return Decimal128.fromString(String(val.$numberDecimal));
      } catch {
        return val.$numberDecimal;
      }
    }

    const res = {};
    for (const key of Object.keys(val)) {
      res[key] = deserializeBsonTypes(val[key]);
    }
    return res;
  }

  return val;
}

// ---------------------------------------------------------------------------
// Execution (read-only)
// ---------------------------------------------------------------------------
export async function executeSafeMongoQuery(plan) {
  validateQuerySafety(plan);

  const { db } = await connectToDatabase();
  const collection = db.collection(plan.collection);

  const maxLimit = plan.limit ? Math.min(Number(plan.limit), 1000) : 500;

  if (plan.operation === 'aggregate') {
    const rawPipeline = Array.isArray(plan.pipeline) ? plan.pipeline : [];
    const pipeline = deserializeBsonTypes(rawPipeline);

    const hasLimit = pipeline.some(
      (s) => typeof s === 'object' && s !== null && '$limit' in s
    );
    if (!hasLimit) {
      pipeline.push({ $limit: maxLimit });
    }
    return await collection.aggregate(pipeline).toArray();
  }

  if (plan.operation === 'find') {
    const filter = deserializeBsonTypes(plan.filter || {});
    let cursor = collection.find(filter);
    if (plan.projection) cursor = cursor.project(plan.projection);
    if (plan.sort) cursor = cursor.sort(plan.sort);
    return await cursor.limit(maxLimit).toArray();
  }

  if (plan.operation === 'countDocuments') {
    const filter = deserializeBsonTypes(plan.filter || {});
    return await collection.countDocuments(filter);
  }

  if (plan.operation === 'distinct' && plan.distinctField) {
    const filter = deserializeBsonTypes(plan.filter || {});
    return await collection.distinct(plan.distinctField, filter);
  }

  throw new Error(`Unsupported operation: ${plan.operation}`);
}
