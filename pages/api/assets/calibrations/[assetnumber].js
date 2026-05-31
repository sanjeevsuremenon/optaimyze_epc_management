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
    if (!session?.user?.email) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { assetnumber } = req.query;

    if (!assetnumber) {
      return res.status(400).json({ error: 'Asset number is required' });
    }

    const db = await getMongoClient();

    // The user's DB might still be using the original names or the asset_ prefixed ones.
    let collectionName = 'asset_equipmentcalibcertificates';
    
    // Try to fetch calibrations
    let calibrations = await db
      .collection(collectionName)
      .find({ assetnumber })
      .sort({ calibrationtodate: -1 })
      .toArray();

    if (!calibrations || calibrations.length === 0) {
      calibrations = await db
        .collection('asset_equipmentcalibcertificate')
        .find({ assetnumber })
        .sort({ calibrationtodate: -1 })
        .toArray();
    }
    
    if (!calibrations || calibrations.length === 0) {
      calibrations = await db
        .collection('equipmentcalibcertificates')
        .find({ assetnumber })
        .sort({ calibrationtodate: -1 })
        .toArray();
    }

    return res.status(200).json(calibrations || []);
  } catch (err) {
    console.error('Failed to fetch calibrations:', err);
    return res.status(500).json({ error: 'Failed to fetch calibrations' });
  }
}
