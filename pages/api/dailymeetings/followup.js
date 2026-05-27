import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../../lib/mongoconnect';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const collection = db.collection('dailymeetings');

  if (req.method === 'POST') {
    try {
      const { taskId, field, newText, updatedBy } = req.body;
      
      if (!taskId || !field || !newText || !updatedBy) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get existing task
      const existingTask = await collection.findOne({ _id: new ObjectId(taskId) });
      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Get existing history
      const history = existingTask.history || [];
      
      // Add new follow-up comment
      const newHistoryEntry = {
        field,
        newText: newText.trim(), // Only the new text added
        timestamp: new Date(),
        updatedBy: updatedBy
      };

      // Update the field value by appending the new text
      const currentValue = existingTask[field] || '';
      const updatedValue = currentValue + (currentValue ? ' ' : '') + newText.trim();

      // Update task with new follow-up and updated field value
      await collection.updateOne(
        { _id: new ObjectId(taskId) },
        { 
          $set: { 
            [field]: updatedValue,
            updatedAt: new Date()
          },
          $push: { 
            history: newHistoryEntry
          }
        }
      );

      return res.status(200).json({ message: 'Follow-up comment added successfully' });
    } catch (error) {
      console.error('Error adding follow-up comment:', error);
      return res.status(500).json({ error: 'Failed to add follow-up comment' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
