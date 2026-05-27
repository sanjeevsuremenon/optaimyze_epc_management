import getMongoClient from '../../../../../lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { id } = req.query;
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message text required' });
  }
  try {
    const db = await getMongoClient();
    const log = await db.collection('prlogs').findOne({ _id: ObjectId(id) });
    if (!log) return res.status(404).json({ error: 'Log not found' });
    if (log.status !== 'open') {
      return res.status(400).json({ error: 'Log is closed' });
    }
    const newMsg = {
      text,
      createdBy: session.user.email,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    await db.collection('prlogs').updateOne(
      { _id: ObjectId(id) },
      { $push: { messages: newMsg } }
    );
    res.status(200).json(newMsg);
  } catch (e) {
    res.status(500).json({ error: 'Failed to add message' });
  }
} 