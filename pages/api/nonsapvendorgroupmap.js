import { connectToDatabase } from '../../lib/mongoconnect';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  switch (req.method) {
    case 'GET':
      try {
        const { nonsapVendorId } = req.query;

        if (!nonsapVendorId || !ObjectId.isValid(String(nonsapVendorId))) {
          return res.status(400).json({ error: 'Valid nonsapVendorId is required' });
        }

        const idStr = String(nonsapVendorId);
        const mappings = await db
          .collection('nonsapvendorgroupmap')
          .find({ nonsapVendorId: idStr })
          .toArray();

        return res.status(200).json(mappings);
      } catch (error) {
        console.error('Error fetching nonsap group mappings:', error);
        return res.status(500).json({ error: 'Failed to fetch mappings' });
      }

    case 'POST':
      try {
        const { nonsapVendorId, subgroupIds } = req.body;

        if (
          !nonsapVendorId ||
          !ObjectId.isValid(String(nonsapVendorId)) ||
          !Array.isArray(subgroupIds)
        ) {
          return res.status(400).json({ error: 'Invalid input data' });
        }

        const idStr = String(nonsapVendorId);

        await db.collection('nonsapvendorgroupmap').deleteMany({
          nonsapVendorId: idStr,
        });

        if (subgroupIds.length === 0) {
          return res.status(201).json({
            message: 'Mappings cleared',
          });
        }

        const mappings = subgroupIds.map((subgroupId) => ({
          nonsapVendorId: idStr,
          subgroupId: new ObjectId(subgroupId),
          createdAt: new Date(),
        }));

        const result = await db
          .collection('nonsapvendorgroupmap')
          .insertMany(mappings);

        return res.status(201).json({
          message: 'Mappings updated successfully',
          result,
        });
      } catch (error) {
        console.error('Error updating nonsap group mappings:', error);
        return res.status(400).json({ error: 'Failed to update mappings' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
