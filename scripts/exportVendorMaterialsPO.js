// scripts/exportVendorMaterialsPO.js
// Requires: MongoDB URI + DB name in env (MONGODB_URI, DB_NAME)

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = "mongodb://127.0.0.1:27017"
const MONGODB_DB = "mmportal"

if (!MONGODB_URI || !MONGODB_DB) {
  console.error('Please set MONGODB_URI and DB_NAME environment variables.');
  process.exit(1);
}

async function main() {
  const client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();
  const db = client.db(MONGODB_DB);

  // 1) Build subgroupId -> (groupName, subgroupName, isService) map
  const groups = await db.collection('materialgroups').find({}).toArray();
  const subgroupIdToInfo = new Map();

  for (const group of groups) {
    const subgroups = await db
      .collection('materialsubgroups')
      .find({ groupId: group._id })
      .toArray();

    for (const subgroup of subgroups) {
      subgroupIdToInfo.set(String(subgroup._id), {
        groupName: group.name || '',
        subgroupName: subgroup.name || '',
        isService: !!group.isService,
      });
    }
  }

  // 2) Vendor → subgroup mappings (registered + unregistered)
  const vendorgroupmap = await db.collection('vendorgroupmap').find({}).toArray();
  const unregisteredvendorgroupmap = await db
    .collection('unregisteredvendorgroupmap')
    .find({})
    .toArray();

  const mappingsByVendorCode = new Map(); // key: vendorCode or legacy name
  for (const m of vendorgroupmap) {
    const key = (m.vendorCode || '').trim();
    if (!key) continue;

    const info = subgroupIdToInfo.get(String(m.subgroupId));
    if (!info) continue;

    if (!mappingsByVendorCode.has(key)) mappingsByVendorCode.set(key, []);
    mappingsByVendorCode.get(key).push(info);
  }

  const mappingsByVendorName = new Map(); // key: vendor-name (unregistered)
  for (const m of unregisteredvendorgroupmap) {
    const key = (m['vendor-name'] || '').trim();
    if (!key) continue;

    const info = subgroupIdToInfo.get(String(m.subgroupId));
    if (!info) continue;

    if (!mappingsByVendorName.has(key)) mappingsByVendorName.set(key, []);
    mappingsByVendorName.get(key).push(info);
  }

  // 3) Purchase orders aggregates: per vendor, distinct PO count + total value in SAR
  const poAgg = await db
    .collection('purchaseorders')
    .aggregate([
      {
        $group: {
          _id: { $ifNull: ['$vendorcode', '$vendor-code'] }, // handle both field styles
          distinctPoNumbers: { $addToSet: '$po-number' },
          totalValueSar: {
            $sum: {
              $cond: [
                { $in: [{ $type: '$po-value-sar' }, ['int', 'long', 'double', 'decimal']] },
                '$po-value-sar',
                {
                  $cond: [
                    { $eq: [{ $type: '$po-value-sar' }, 'string'] },
                    { $toDouble: '$po-value-sar' },
                    0,
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          vendorcode: '$_id',
          totalPoCount: { $size: '$distinctPoNumbers' },
          totalPoValueSar: '$totalValueSar',
        },
      },
    ])
    .toArray();

  const poByVendorCode = new Map();
  for (const p of poAgg) {
    const key = (p.vendorcode || '').toString().trim();
    if (!key) continue;
    poByVendorCode.set(key, {
      totalPoCount: p.totalPoCount,
      totalPoValueSar: p.totalPoValueSar,
    });
  }

  // 4) Fetch all vendors
  const vendors = await db.collection('vendors').find({}).toArray();

  // 5) Build rows: vendor + each mapped material subgroup + PO stats
  const rows = [];

  for (const v of vendors) {
    const vendorCodeRaw = v['vendor-code'];
    const vendorName = (v['vendor-name'] || '').trim();
    const codeStr = vendorCodeRaw != null ? String(vendorCodeRaw).trim() : '';

    // Same logic as existing code: vendor with no code or code == name is "unregistered"
    const isUnregistered = !codeStr || codeStr === vendorName;

    const mappingList = isUnregistered
      ? (mappingsByVendorName.get(vendorName) ||
          mappingsByVendorCode.get(vendorName) ||
          [])
      : (mappingsByVendorCode.get(codeStr) || []);

    const poStats =
      poByVendorCode.get(codeStr) || {
        totalPoCount: 0,
        totalPoValueSar: 0,
      };

    if (mappingList.length === 0) {
      // Vendor with no material subgroup mapping, still include with PO stats
      rows.push({
        vendorCode: vendorCodeRaw ?? '',
        vendorName,
        groupName: '',
        subgroupName: '',
        isService: '',
        totalPoValueSar: poStats.totalPoValueSar,
        totalPoCount: poStats.totalPoCount,
      });
    } else {
      for (const m of mappingList) {
        rows.push({
          vendorCode: vendorCodeRaw ?? '',
          vendorName,
          groupName: m.groupName,
          subgroupName: m.subgroupName,
          isService: m.isService ? 'Y' : 'N',
          totalPoValueSar: poStats.totalPoValueSar,
          totalPoCount: poStats.totalPoCount,
        });
      }
    }
  }

  // 6) Convert to CSV
  function escapeCsv(value) {
    if (value === null || value === undefined) return '';
    const s = String(value);
    if (/[",\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  const header = [
    'vendor-code',
    'vendor-name',
    'material-group',
    'material-subgroup',
    'is-service',
    'total-po-value-sar',
    'total-po-count',
  ];

  const csvLines = [header.join(',')];

  for (const row of rows) {
    csvLines.push(
      [
        escapeCsv(row.vendorCode),
        escapeCsv(row.vendorName),
        escapeCsv(row.groupName),
        escapeCsv(row.subgroupName),
        escapeCsv(row.isService),
        escapeCsv(row.totalPoValueSar),
        escapeCsv(row.totalPoCount),
      ].join(',')
    );
  }

  const outputPath = path.join(process.cwd(), 'vendor-materials-po-summary.csv');
  fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf8');

  console.log(`Wrote ${rows.length} rows to ${outputPath}`);

  await client.close();
}

main().catch((err) => {
  console.error('Error running export script:', err);
  process.exit(1);
});