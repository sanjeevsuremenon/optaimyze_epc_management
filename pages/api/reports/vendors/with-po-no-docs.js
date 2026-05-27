import { connectToDatabase } from "../../../../lib/mongoconnect";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { db } = await connectToDatabase();

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
      // vendor must have at least one PO
      { $match: { 'pos.0': { $exists: true } } },
      {
        $lookup: {
          from: 'vendordocuments',
          localField: 'vendor-code',
          foreignField: 'vendorCode',
          as: 'docs'
        }
      },
      // no docs uploaded
      { $match: { 'docs.0': { $exists: false } } },
      {
        $project: {
          _id: 0,
          'vendor-code': '$vendor-code',
          'vendor-name': '$vendor-name',
          'created_date': 1,
          'created_by': 1,
          poCount: { $size: '$pos' }
        }
      },
      { $sort: { 'created_date': -1 } }
    ];

    const vendors = await db.collection('vendors').aggregate(pipeline).toArray();

    return res.status(200).json(vendors);
  } catch (error) {
    console.error('Error generating vendors with PO but no docs report:', error);
    return res.status(500).json({ error: 'Error generating report' });
  }
}
