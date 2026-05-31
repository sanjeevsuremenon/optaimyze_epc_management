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

    const { assetNumber, assetName, minAcquiredDate, minAcquiredValue, limit = "100", skip = "0" } = req.query;

    const db = await getMongoClient();

    const query = {};
    if (assetNumber?.trim()) {
      query.assetnumber = { $regex: assetNumber, $options: 'i' };
    }
    if (assetName?.trim()) {
      query.assetdescription = { $regex: assetName, $options: 'i' };
    }

    if (minAcquiredDate) {
      const dateVal = new Date(minAcquiredDate);
      if (!isNaN(dateVal.getTime())) {
        query.$or = [
          { acquireddate: { $gt: dateVal } },
          { acquireddate: { $gt: dateVal.toISOString() } },
          {
            $and: [
              { acquireddate: { $type: "string" } },
              { $expr: { $gt: [{ $dateFromString: { dateString: "$acquireddate" } }, dateVal] } }
            ]
          }
        ];
      }
    }

    if (minAcquiredValue) {
      const val = parseFloat(minAcquiredValue);
      if (!isNaN(val)) {
        query.$and = [
          { acquiredvalue: { $exists: true, $ne: null } },
          {
            $or: [
              { acquiredvalue: { $gt: val } },
              {
                $and: [
                  { acquiredvalue: { $type: "string" } },
                  { $expr: { $gt: [{ $toDouble: "$acquiredvalue" }, val] } }
                ]
              }
            ]
          }
        ];
      }
    }

    const limitVal = parseInt(limit, 10) || 100;
    const skipVal = parseInt(skip, 10) || 0;

    const assets = await db
      .collection('asset_equipmentandtools')
      .find(query)
      .sort({ _id: 1 })
      .skip(skipVal)
      .limit(limitVal)
      .toArray();

    return res.status(200).json(assets);
  } catch (err) {
    console.error('Failed to fetch MME equipments:', err);
    return res.status(500).json({ error: 'Failed to fetch MME equipments' });
  }
}
