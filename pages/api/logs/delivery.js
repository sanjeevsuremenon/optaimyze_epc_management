import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../../lib/mongoconnect';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const collection = db.collection('deliverylogs');

  if (req.method === 'GET') {
    const logs = await collection.find({}).sort({ createdDate: -1 }).toArray();
    return res.status(200).json(logs);
  }

  if (req.method === 'POST') {
    const { project, title, priority, deliveryRef, requestInfo, createdBy, createdDate, status, lastUpdated } = req.body;
    if (!project || !title || !priority || !deliveryRef || !requestInfo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const logData = { 
      project, 
      title, 
      priority, 
      deliveryRef, 
      requestInfo, 
      createdBy, 
      createdDate, 
      status, 
      lastUpdated,
      type: 'open delivery'
    };
    const result = await collection.insertOne(logData);
    return res.status(201).json({ _id: result.insertedId, ...logData });
  }

  if (req.method === 'PUT') {
    const { _id, ...updateFields } = req.body;
    if (!_id) return res.status(400).json({ error: 'Missing _id' });
    await collection.updateOne({ _id: new ObjectId(_id) }, { $set: updateFields });
    return res.status(200).json({ message: 'Updated' });
  }

  if (req.method === 'DELETE') {
    const { _id } = req.body;
    if (!_id) return res.status(400).json({ error: 'Missing _id' });
    await collection.deleteOne({ _id: new ObjectId(_id) });
    return res.status(200).json({ message: 'Deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 