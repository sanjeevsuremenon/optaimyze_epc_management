/**
 * One-time migration: copy `registeredvendors` -> `nonsapvendors` (same _id),
 * set internalVendorCode = _id string, optionally copy group mappings from
 * `unregisteredvendorgroupmap` (vendor-name) -> `nonsapvendorgroupmap` (nonsapVendorId).
 *
 * Loads `MONGODB_URI` and `DB_NAME` from `.env.local` at the repo root (same as the app).
 * Shell env vars override `.env.local` if already set.
 *
 * Usage (from repo root):
 *   node scripts/migrate-registeredvendors-to-nonsapvendors.js
 */

const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    return;
  }
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

async function main() {
  loadEnvLocal();
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;
  if (!uri || !dbName) {
    console.error('Set MONGODB_URI and DB_NAME (same as Next app / lib/mongoconnect).');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const from = db.collection('registeredvendors');
  const to = db.collection('nonsapvendors');

  const all = await from.find({}).toArray();
  let upserted = 0;
  for (const doc of all) {
    const internalVendorCode = doc._id.toString();
    const { _id, ...rest } = doc;
    await to.replaceOne(
      { _id },
      { _id, ...rest, internalVendorCode },
      { upsert: true }
    );
    upserted += 1;
  }
  console.log(`nonsapvendors: upserted ${upserted} documents (from registeredvendors).`);

  const unreg = db.collection('unregisteredvendorgroupmap');
  const nonsapMap = db.collection('nonsapvendorgroupmap');

  const byName = await unreg.aggregate([{ $group: { _id: '$vendor-name', docs: { $push: '$$ROOT' } } }]).toArray();

  let mapCount = 0;
  let ambiguous = 0;
  for (const row of byName) {
    const vendorName = row._id;
    if (!vendorName) continue;
    const matches = await to
      .find({ vendorname: vendorName })
      .project({ _id: 1 })
      .toArray();
    if (matches.length === 0) continue;
    if (matches.length > 1) {
      ambiguous += 1;
      console.warn(
        `Skipping group map for duplicate vendor name "${vendorName}" (${matches.length} rows in nonsapvendors).`
      );
      continue;
    }
    const nonsapVendorId = matches[0]._id.toString();
    const subgroupIds = [...new Set(row.docs.map((d) => d.subgroupId).filter(Boolean))];
    await nonsapMap.deleteMany({ nonsapVendorId });
    if (subgroupIds.length) {
      await nonsapMap.insertMany(
        subgroupIds.map((subgroupId) => ({
          nonsapVendorId,
          subgroupId: subgroupId instanceof ObjectId ? subgroupId : new ObjectId(String(subgroupId)),
          createdAt: new Date(),
        }))
      );
      mapCount += subgroupIds.length;
    }
  }
  console.log(
    `nonsapvendorgroupmap: wrote ${mapCount} subgroup rows from unregisteredvendorgroupmap; ${ambiguous} ambiguous names skipped.`
  );

  await client.close();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
