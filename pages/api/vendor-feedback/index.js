import { connectToDatabase } from '../../../lib/mongoconnect';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  const { method } = req;
  
  // Disable caching
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  
  const session = await getServerSession(req, res, authOptions);
  
  console.log('Vendor Feedback API - Method:', method);
  console.log('Vendor Feedback API - Session:', session ? 'Present' : 'Missing');
  console.log('Vendor Feedback API - User:', session?.user?.email);

  if (!session) {
    console.log('Vendor Feedback API - No session, returning 401');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { db } = await connectToDatabase();

    switch (method) {
      case 'GET':
        try {
          const feedbacks = await db
            .collection('vendor_feedback')
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
          
          return res.status(200).json(feedbacks);
        } catch (error) {
          console.error('Error fetching vendor feedbacks:', error);
          return res.status(500).json({ error: 'Failed to fetch feedbacks' });
        }

      case 'POST':
        try {
          const { comment, vendorCode, vendorName, username, userId } = req.body;

          if (!comment || !comment.trim()) {
            return res.status(400).json({ error: 'Comment is required' });
          }

          const feedback = {
            comment: comment.trim(),
            vendorCode: vendorCode?.trim() || '',
            vendorName: vendorName?.trim() || '',
            username: username || session.user.name || session.user.email,
            userId: userId || session.user.email,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const result = await db.collection('vendor_feedback').insertOne(feedback);
          
          return res.status(201).json({ 
            _id: result.insertedId, 
            ...feedback 
          });
        } catch (error) {
          console.error('Error creating vendor feedback:', error);
          return res.status(500).json({ error: 'Failed to create feedback' });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ error: 'Database connection failed' });
  }
}
