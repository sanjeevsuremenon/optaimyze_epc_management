import { connectToDatabase } from '../../../lib/mongoconnect';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { term } = req.query;
    console.log('Enhanced search term received:', term);

    if (!term || term.length < 3) {
      return res.status(400).json({ error: 'Search term must be at least 3 characters' });
    }

    const { db } = await connectToDatabase();

    // Create a case-insensitive search regex
    const searchRegex = new RegExp(term, 'i');

    // Search in both vendors and registeredvendors collections
    const [vendors, registeredVendors] = await Promise.all([
      db.collection('vendors')
        .find({
          $or: [
            { 'vendor-name': searchRegex },
            { 'vendor-code': searchRegex }
          ]
        })
        .project({
          'vendor-name': 1,
          'vendor-code': 1,
          'created_date': 1,
          _id: 0
        })
        .limit(10)
        .toArray(),
      
      db.collection('registeredvendors')
        .find({
          $or: [
            { vendorname: searchRegex },
            { vendorcode: searchRegex }
          ]
        })
        .project({
          vendorname: 1,
          vendorcode: 1,
          created_at: 1,
          _id: 0
        })
        .limit(10)
        .toArray()
    ]);

    // Transform the response to match the expected format
    const transformedVendors = [
      ...vendors.map(vendor => ({
        vendorname: vendor['vendor-name'],
        vendorcode: vendor['vendor-code'],
        source: 'vendors',
        created_date: vendor.created_date
      })),
      ...registeredVendors.map(vendor => ({
        vendorname: vendor.vendorname,
        vendorcode: vendor.vendorcode,
        source: 'registeredvendors',
        created_date: vendor.created_at
      }))
    ];

    // Sort by creation date (most recent first)
    transformedVendors.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    console.log('Enhanced search results:', transformedVendors);

    return res.status(200).json(transformedVendors);
  } catch (error) {
    console.error('Enhanced search error:', error);
    return res.status(500).json({ error: 'Failed to search vendors' });
  }
}

