import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../../lib/mongoconnect';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const collection = db.collection('prlogs');

  if (req.method === 'GET') {
    // Fetch all PR logs
    const logs = await collection.find({}).sort({ createdDate: -1 }).toArray();
    return res.status(200).json(logs);
  }

  if (req.method === 'POST') {
    // Create a new PR log
    const { project, title, priority, prNumber, requestInfo, createdBy, createdDate, status, lastUpdated } = req.body;
    if (!project || !title || !priority || !prNumber || !requestInfo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const logData = { 
      project, 
      title, 
      priority, 
      prNumber, 
      requestInfo, 
      createdBy, 
      createdDate, 
      status, 
      lastUpdated,
      type: 'open PR'
    };
    const result = await collection.insertOne(logData);
    return res.status(201).json({ _id: result.insertedId, ...logData });
  }

  if (req.method === 'PUT') {
    // Update a PR log by _id
    const { _id, ...updateFields } = req.body;
    if (!_id) return res.status(400).json({ error: 'Missing _id' });
    await collection.updateOne({ _id: new ObjectId(_id) }, { $set: updateFields });
    return res.status(200).json({ message: 'Updated' });
  }

  if (req.method === 'DELETE') {
    // Delete a PR log by _id
    const { _id } = req.body;
    if (!_id) return res.status(400).json({ error: 'Missing _id' });
    await collection.deleteOne({ _id: new ObjectId(_id) });
    return res.status(200).json({ message: 'Deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 