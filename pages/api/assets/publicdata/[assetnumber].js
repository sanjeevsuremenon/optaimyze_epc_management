import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import getMongoClient from "../../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Dynamic host detection to prevent NEXTAUTH_URL mismatches and localhost resolution errors
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    let host = req.headers['x-forwarded-host'] || req.headers.host || '127.0.0.1:3000';
    if (host.startsWith('localhost')) {
      host = host.replace('localhost', '127.0.0.1');
    }
    process.env.NEXTAUTH_URL = `${protocol}://${host}`;

    const session = await getServerSession(req, res, authOptions);
    const isLoggedIn = !!session?.user?.email;

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

    // Convert BSON _id to string for clean serialization
    if (asset._id) {
      asset._id = String(asset._id);
    }

    // Strip price info if the user is not authenticated
    if (!isLoggedIn) {
      delete asset.acquiredvalue;
      asset.priceHidden = true;
    } else {
      asset.priceHidden = false;
    }

    return res.status(200).json(asset);
  } catch (err) {
    console.error('Failed to fetch public asset details:', err);
    return res.status(500).json({ error: 'Failed to fetch public asset details' });
  }
}
