import { connectToDatabase } from '../../../../lib/mongoconnect';
import { ObjectId } from 'mongodb';

/**
 * GET: Returns vendors who have at least one PO, with their mapped
 * material/service group-subgroup labels for display.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();

    // 1. Vendors with at least one PO
    const vendorList = await db.collection('vendorsandtheirpo').aggregate([
      { $match: { vendorpo: { $not: { $size: 0 } } } },
      { $project: { 'vendor-code': 1, 'vendor-name': 1 } }
    ]).toArray();

    // 2. Groups with subgroups for resolving subgroupId -> label
    const groups = await db.collection('materialgroups').find({}).sort({ name: 1 }).toArray();
    const subgroupIdToInfo = new Map();
    for (const group of groups) {
      const subgroups = await db.collection('materialsubgroups')
        .find({ groupId: group._id })
        .sort({ name: 1 })
        .toArray();
      for (const subgroup of subgroups) {
        subgroupIdToInfo.set(String(subgroup._id), {
          groupName: group.name,
          subgroupName: subgroup.name,
          isService: !!group.isService
        });
      }
    }

    // 3. All vendor-group mappings
    const allMappings = await db.collection('vendorgroupmap').find({}).toArray();

    // 4. Build mappings by vendorCode (normalize for matching)
    const mappingsByVendor = new Map();
    for (const m of allMappings) {
      const code = m.vendorCode;
      if (!mappingsByVendor.has(code)) mappingsByVendor.set(code, []);
      const info = subgroupIdToInfo.get(String(m.subgroupId));
      if (info) mappingsByVendor.get(code).push(info);
    }

    // 5. Attach mappings to each vendor (match vendor-code from collection)
    const result = vendorList.map((v) => {
      const code = v['vendor-code'];
      const mappings = mappingsByVendor.get(code) || [];
      return {
        'vendor-code': code,
        'vendor-name': v['vendor-name'] || '',
        mappings
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in vendorswithpo/with-mappings:', error);
    return res.status(500).json({ error: 'Failed to fetch vendors with mappings' });
  }
}
