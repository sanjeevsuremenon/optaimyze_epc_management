import { connectToDatabase } from '../../../lib/mongoconnect';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { term } = req.query;
    console.log('Search term received:', term);

    if (!term) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const { db } = await connectToDatabase();

    // Create a case-insensitive search regex
    const searchRegex = new RegExp(term, 'i');

    const vendors = await db.collection('vendors')
      .find({
        $or: [
          { 'vendor-name': searchRegex },
          { 'vendor-code': searchRegex }
        ]
      })
      .project({
        'vendor-name': 1,
        'vendor-code': 1,
        _id: 0
      })
      .limit(10)
      .toArray();

    // Transform the response to match the expected format in the frontend
    const transformedVendors = vendors.map(vendor => ({
      vendorname: vendor['vendor-name'],
      vendorcode: vendor['vendor-code']
    }));

    console.log('Search results:', transformedVendors);

    return res.status(200).json(transformedVendors);
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Failed to search vendors' });
  }
} 