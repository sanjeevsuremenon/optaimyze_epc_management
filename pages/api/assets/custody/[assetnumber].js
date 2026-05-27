import { getSession } from "next-auth/react";
import getMongoClient from "../../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session?.user?.email) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { assetnumber } = req.query;

    if (!assetnumber) {
      return res.status(400).json({ error: 'Asset number is required' });
    }

    const db = await getMongoClient();

    let collectionName = 'asset_equipmentcustody';

    let custodyRecords = await db
      .collection(collectionName)
      .find({ assetnumber })
      .sort({ custodyfrom: -1 })
      .toArray();

    if (!custodyRecords || custodyRecords.length === 0) {
      custodyRecords = await db
        .collection('equipmentcustody')
        .find({ assetnumber })
        .sort({ custodyfrom: -1 })
        .toArray();
    }

    return res.status(200).json(custodyRecords || []);
  } catch (err) {
    console.error('Failed to fetch custody records:', err);
    return res.status(500).json({ error: 'Failed to fetch custody records' });
  }
}
