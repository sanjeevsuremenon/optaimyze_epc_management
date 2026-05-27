import { getSession } from "next-auth/react";
import getMongoClient from "../../../lib/mongodb";

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

    let asset = await db.collection('asset_equipmentandtools').findOne({ assetnumber });
    
    if (!asset) {
      asset = await db.collection('asset_fixedassets').findOne({ assetnumber });
    }

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    return res.status(200).json(asset);
  } catch (err) {
    console.error('Failed to fetch asset details:', err);
    return res.status(500).json({ error: 'Failed to fetch asset details' });
  }
}
