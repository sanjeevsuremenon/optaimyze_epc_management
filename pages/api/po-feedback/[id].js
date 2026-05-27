import { connectToDatabase } from '../../../lib/mongoconnect';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { method, query: { id } } = req;
  
  // Disable caching
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { db } = await connectToDatabase();

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid feedback ID' });
    }

    const objectId = new ObjectId(id);

    switch (method) {
      case 'PUT':
        try {
          const { comment, poNumber, poTitle } = req.body;

          if (!comment || !comment.trim()) {
            return res.status(400).json({ error: 'Comment is required' });
          }

          const updateData = {
            comment: comment.trim(),
            poNumber: poNumber?.trim() || '',
            poTitle: poTitle?.trim() || '',
            updatedAt: new Date()
          };

          const result = await db
            .collection('po_feedback')
            .updateOne(
              { _id: objectId, userId: session.user.email },
              { $set: updateData }
            );

          if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Feedback not found or unauthorized' });
          }

          if (result.modifiedCount === 0) {
            return res.status(400).json({ error: 'No changes made' });
          }

          return res.status(200).json({ message: 'Feedback updated successfully' });
        } catch (error) {
          console.error('Error updating PO feedback:', error);
          return res.status(500).json({ error: 'Failed to update feedback' });
        }

      case 'DELETE':
        try {
          const result = await db
            .collection('po_feedback')
            .deleteOne({ _id: objectId, userId: session.user.email });

          if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Feedback not found or unauthorized' });
          }

          return res.status(200).json({ message: 'Feedback deleted successfully' });
        } catch (error) {
          console.error('Error deleting PO feedback:', error);
          return res.status(500).json({ error: 'Failed to delete feedback' });
        }

      default:
        res.setHeader('Allow', ['PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ error: 'Database connection failed' });
  }
}
