import { connectToDatabase } from "../../../../lib/mongoconnect";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();

    // Aggregation: left-join with purchaseorders and vendordocuments
    const pipeline = [
      { $match: { 'vendor-code': { $exists: true, $ne: '' } } },
      {
        $lookup: {
          from: 'purchaseorders',
          localField: 'vendor-code',
          foreignField: 'vendorcode',
          as: 'pos'
        }
      },
      {
        $lookup: {
          from: 'vendordocuments',
          localField: 'vendor-code',
          foreignField: 'vendorCode',
          as: 'docs'
        }
      },
      // Keep only vendors with no purchase orders
      { $match: { 'pos.0': { $exists: false } } },
      {
        $project: {
          _id: 0,
          'vendor-code': '$vendor-code',
          'vendor-name': '$vendor-name',
          'created_date': 1,
          'created_by': 1,
          documentsUploaded: { $gt: [{ $size: '$docs' }, 0] },
        }
      },
      { $sort: { 'created_date': -1 } }
    ];

    const vendors = await db.collection('vendors').aggregate(pipeline).toArray();

    return res.status(200).json(vendors);
  } catch (error) {
    console.error('Error generating vendor report:', error);
    return res.status(500).json({ error: 'Error generating report' });
  }
}
