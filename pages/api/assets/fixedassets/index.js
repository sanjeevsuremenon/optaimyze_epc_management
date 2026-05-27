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

    const { assetNumber, assetName } = req.query;

    if (!assetNumber?.trim() && !assetName?.trim()) {
      return res.status(200).json([]);
    }

    const db = await getMongoClient();

    const query = {};
    if (assetNumber?.trim()) {
      query.assetnumber = { $regex: assetNumber, $options: 'i' };
    }
    if (assetName?.trim()) {
      query.assetdescription = { $regex: assetName, $options: 'i' };
    }

    const assets = await db
      .collection('asset_fixedassets')
      .find(query)
      .toArray();

    return res.status(200).json(assets);
  } catch (err) {
    console.error('Failed to fetch fixed assets:', err);
    return res.status(500).json({ error: 'Failed to fetch fixed assets' });
  }
}
