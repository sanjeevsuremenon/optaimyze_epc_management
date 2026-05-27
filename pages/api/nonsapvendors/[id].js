import { connectToDatabase } from '../../../lib/mongoconnect';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid id' });
  }

  try {
    const { db } = await connectToDatabase();
    const doc = await db.collection('nonsapvendors').findOne({
      _id: new ObjectId(id),
    });
    if (!doc) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    return res.status(200).json(doc);
  } catch (error) {
    console.error('nonsapvendors [id] GET:', error);
    return res.status(500).json({ error: error.message });
  }
}
