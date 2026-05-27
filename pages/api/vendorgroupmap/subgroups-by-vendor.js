import { connectToDatabase } from '../../../lib/mongoconnect';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const { vendorCode } = req.query;

    if (!vendorCode || !vendorCode.trim()) {
      return res.status(400).json({ error: 'Vendor code is required' });
    }

    const code = vendorCode.trim();

    // Registered: vendorgroupmap has vendorCode
    const registeredMappings = await db.collection('vendorgroupmap')
      .find({ vendorCode: code })
      .toArray();

    // Unregistered: unregisteredvendorgroupmap has vendor-name
    const unregisteredMappings = await db.collection('unregisteredvendorgroupmap')
      .find({ 'vendor-name': code })
      .toArray();

    const allSubgroupIds = [
      ...registeredMappings.map((m) => m.subgroupId),
      ...unregisteredMappings.map((m) => m.subgroupId)
    ].filter(Boolean);

    if (allSubgroupIds.length === 0) {
      return res.status(200).json([]);
    }

    const uniqueSubgroupIds = [...new Set(allSubgroupIds.map((id) => (id && id.toString ? id.toString() : String(id))))];

    const subgroups = await db.collection('materialsubgroups')
      .find({ _id: { $in: uniqueSubgroupIds.map((id) => new ObjectId(id)) } })
      .toArray();

    const groupIds = [...new Set(subgroups.map((s) => s.groupId?.toString()).filter(Boolean))];
    const groups = await db.collection('materialgroups')
      .find({ _id: { $in: groupIds.map((id) => new ObjectId(id)) } })
      .toArray();

    const groupMap = Object.fromEntries(groups.map((g) => [g._id.toString(), g.name]));

    const result = subgroups.map((sg) => ({
      subgroupId: sg._id.toString(),
      subgroupName: sg.name || '',
      groupName: groupMap[sg.groupId?.toString()] || '',
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching subgroups by vendor:', error);
    return res.status(500).json({ error: 'Failed to fetch subgroups' });
  }
}
