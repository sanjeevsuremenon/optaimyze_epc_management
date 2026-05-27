import getMongoClient from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { id } = req.query;
  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid log id' });
  }
  try {
    const db = await getMongoClient();
    const log = await db.collection('postdeliverylogs').findOne({ _id: objectId });
    if (!log) return res.status(404).json({ error: 'Log not found' });
    res.status(200).json({ log, messages: log.messages || [] });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch log' });
  }
} 