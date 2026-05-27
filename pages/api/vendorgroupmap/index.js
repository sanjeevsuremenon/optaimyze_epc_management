import { connectToDatabase } from '../../../lib/mongoconnect';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  switch (req.method) {
    case 'GET':
      try {
        const { vendorCode } = req.query;
        
        if (!vendorCode) {
          return res.status(400).json({ error: 'Vendor code is required' });
        }

        const mappings = await db.collection('vendorgroupmap')
          .find({ vendorCode })
          .toArray();

        return res.status(200).json(mappings);
      } catch (error) {
        console.error('Error fetching mappings:', error);
        return res.status(500).json({ error: 'Failed to fetch mappings' });
      }

    case 'POST':
      try {
        const { vendorCode, subgroupIds } = req.body;

        if (!vendorCode || !subgroupIds || !Array.isArray(subgroupIds)) {
          return res.status(400).json({ error: 'Invalid input data' });
        }

        // First, delete existing mappings for this vendor
        await db.collection('vendorgroupmap').deleteMany({ vendorCode });

        // Create new mappings
        const mappings = subgroupIds.map(subgroupId => ({
          vendorCode,
          subgroupId: new ObjectId(subgroupId),
          createdAt: new Date()
        }));

        const result = await db.collection('vendorgroupmap').insertMany(mappings);

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