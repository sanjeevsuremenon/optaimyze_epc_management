import { connectToDatabase } from '../../../lib/mongoconnect';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    const { db } = await connectToDatabase();
    const { id } = req.query;

    switch (req.method) {
      case 'GET':
        try {
          const group = await db.collection('materialgroups').findOne({
            _id: new ObjectId(id)
          });

          if (!group) {
            return res.status(404).json({ error: 'Group not found' });
          }

          // Get subgroups for this group
          const subgroups = await db.collection('materialsubgroups')
            .find({ groupId: group._id })
            .toArray();

          res.status(200).json({ ...group, subgroups });
        } catch (error) {
          console.error('Error fetching group:', error);
          res.status(400).json({ error: 'Failed to fetch group' });
        }
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
} 