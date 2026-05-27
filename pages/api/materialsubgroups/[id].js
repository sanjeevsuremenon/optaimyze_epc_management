import { connectToDatabase } from '../../../lib/mongoconnect';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    const { db } = await connectToDatabase();
    const { id } = req.query;

    switch (req.method) {
      case 'GET':
        try {
          const subgroup = await db.collection('materialsubgroups').findOne({
            _id: new ObjectId(id)
          });

          if (!subgroup) {
            return res.status(404).json({ error: 'Subgroup not found' });
          }

          res.status(200).json(subgroup);
        } catch (error) {
          console.error('Error fetching subgroup:', error);
          res.status(400).json({ error: 'Failed to fetch subgroup' });
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