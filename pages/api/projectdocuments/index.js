import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../../lib/mongoconnect';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const collection = db.collection('projectdocumentss');

  if (req.method === 'GET') {
    try {
      // Fetch all open tasks (closeFlag: false) sorted by date (newest first)
      const tasks = await collection
        .find({ closeFlag: { $ne: true } })
        .sort({ date: -1, createdAt: -1 })
        .toArray();
      return res.status(200).json(tasks);
    } catch (error) {
      console.error('Error fetching Project Documents:', error);
      return res.status(500).json({ error: 'Failed to fetch Project Documents' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { date, project, selectdown, discussionPoint, actionBy, closeFlag } = req.body;
      
      if (!date || !project || !selectdown || !discussionPoint || !actionBy) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const meetingData = {
        date: new Date(date),
        project,
        selectdown,
        discussionPoint,
        actionBy,
        closeFlag: closeFlag || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(meetingData);
      return res.status(201).json({ _id: result.insertedId, ...meetingData });
    } catch (error) {
      console.error('Error creating Project Document:', error);
      return res.status(500).json({ error: 'Failed to create Project Document' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { _id, ...updateFields } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Missing _id' });
      }

      // Get existing task to compare values
      const existingTask = await collection.findOne({ _id: new ObjectId(_id) });
      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Prevent editing of discussionPoint and actionBy - these can only be updated via follow-up comments
      // Remove these fields from updateFields if they're being changed
      if (updateFields.discussionPoint !== undefined && updateFields.discussionPoint !== existingTask.discussionPoint) {
        delete updateFields.discussionPoint;
      }
      if (updateFields.actionBy !== undefined && updateFields.actionBy !== existingTask.actionBy) {
        delete updateFields.actionBy;
      }

      // Convert date string to Date object if date is being updated
      if (updateFields.date) {
        updateFields.date = new Date(updateFields.date);
      }
      updateFields.updatedAt = new Date();

      await collection.updateOne(
        { _id: new ObjectId(_id) },
        { $set: updateFields }
      );
      return res.status(200).json({ message: 'Updated successfully' });
    } catch (error) {
      console.error('Error updating Project Document:', error);
      return res.status(500).json({ error: 'Failed to update Project Document' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Missing _id' });
      }
      await collection.deleteOne({ _id: new ObjectId(_id) });
      return res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
      console.error('Error deleting Project Document:', error);
      return res.status(500).json({ error: 'Failed to delete Project Document' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
