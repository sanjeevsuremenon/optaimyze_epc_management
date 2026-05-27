import { connectToDatabase } from '../../lib/mongoconnect';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  switch (req.method) {
    case 'GET':
      try {
        const { vendorName } = req.query;
        
        if (!vendorName) {
          return res.status(400).json({ error: 'Vendor name is required' });
        }

        const mappings = await db.collection('unregisteredvendorgroupmap')
          .find({ 'vendor-name': vendorName })
          .toArray();

        return res.status(200).json(mappings);
      } catch (error) {
        console.error('Error fetching mappings:', error);
        return res.status(500).json({ error: 'Failed to fetch mappings' });
      }

    case 'POST':
      try {
        const { vendorName, subgroupIds } = req.body;

        if (!vendorName || !subgroupIds || !Array.isArray(subgroupIds)) {
          return res.status(400).json({ error: 'Invalid input data' });
        }

        // First, delete existing mappings for this vendor
        await db.collection('unregisteredvendorgroupmap').deleteMany({ 'vendor-name': vendorName });

        // Create new mappings
        const mappings = subgroupIds.map(subgroupId => ({
          'vendor-name': vendorName,
          subgroupId: new ObjectId(subgroupId),
          createdAt: new Date()
        }));

        const result = await db.collection('unregisteredvendorgroupmap').insertMany(mappings);

        return res.status(201).json({
          message: 'Mappings updated successfully',
          result
        });
      } catch (error) {
        console.error('Error updating mappings:', error);
        return res.status(400).json({ error: 'Failed to update mappings' });
      }

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
} 