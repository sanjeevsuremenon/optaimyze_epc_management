import { connectToDatabase } from '../../../lib/mongoconnect';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  switch (req.method) {
    case 'GET':
      try {
        const { subgroupId } = req.query;
        
        if (!subgroupId) {
          return res.status(400).json({ error: 'Subgroup ID is required' });
        }

        // Get all vendor codes mapped to this subgroup
        const mappings = await db.collection('vendorgroupmap')
          .find({ subgroupId: new ObjectId(subgroupId) })
          .toArray();

        if (mappings.length === 0) {
          return res.status(200).json([]);
        }

        // Extract unique vendor codes
        const vendorCodes = [...new Set(mappings.map(mapping => mapping.vendorCode))];

        // Fetch vendor details for these vendor codes
        const vendors = await db.collection('vendors')
          .find({ 
            $or: [
              { 'vendor-code': { $in: vendorCodes } },
              { 'vendor-name': { $in: vendorCodes } }
            ]
          })
          .toArray();

        // Also check for unregistered vendors if they exist in unregisteredvendorgroupmap
        const unregisteredMappings = await db.collection('unregisteredvendorgroupmap')
          .find({ subgroupId: new ObjectId(subgroupId) })
          .toArray();

        const unregisteredVendors = unregisteredMappings.map(mapping => ({
          'vendor-name': mapping['vendor-name'] || mapping.vendorName,
          'vendor-code': mapping['vendor-code'] || mapping.vendorCode || 'NA',
          isUnregistered: true,
          mappingDate: mapping.createdAt
        }));

        // Also check for non-SAP vendors
        const nonsapMappings = await db.collection('nonsapvendorgroupmap')
          .find({ subgroupId: new ObjectId(subgroupId) })
          .toArray();

        const nonsapVendorIds = [...new Set(nonsapMappings.map(mapping => mapping.nonsapVendorId))];
        const nonsapVendorRecords = await db.collection('nonsapvendors')
          .find({ _id: { $in: nonsapVendorIds.map(id => new ObjectId(id)) } })
          .toArray();

        const nonsapVendors = nonsapVendorRecords.map(vendor => ({
          ...vendor,
          'vendor-name': vendor.vendorname,
          'vendor-code': 'NA',
          isUnregistered: true,
          isNonsap: true
        }));

        // Combine all vendors
        const allVendors = [
          ...vendors.map(vendor => ({ ...vendor, isUnregistered: false })),
          ...unregisteredVendors,
          ...nonsapVendors
        ];

        return res.status(200).json(allVendors);
      } catch (error) {
        console.error('Error fetching vendors by subgroup:', error);
        return res.status(500).json({ error: 'Failed to fetch vendors' });
      }

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
