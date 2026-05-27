import { connectToDatabase } from '../../../lib/mongoconnect';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const collection = db.collection('dailymeetings');

  if (req.method === 'GET') {
    try {
      // Fetch all closed tasks (closeFlag: true) sorted by date (newest first)
      const tasks = await collection
        .find({ closeFlag: true })
        .sort({ date: -1, createdAt: -1 })
        .toArray();
      return res.status(200).json(tasks);
    } catch (error) {
      console.error('Error fetching closed tasks:', error);
      return res.status(500).json({ error: 'Failed to fetch closed tasks' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
