import { connectToDatabase } from '../../../../lib/mongoconnect';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  const { method } = req;
  
  // Disable caching
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { db } = await connectToDatabase();
    const { ponumber } = req.query;

    if (!ponumber) {
      return res.status(400).json({ error: 'PO number is required' });
    }

    switch (method) {
      case 'GET':
        try {
          const feedbacks = await db
            .collection('po_feedback')
            .find({ poNumber: ponumber })
            .sort({ createdAt: -1 })
            .toArray();
          
          return res.status(200).json(feedbacks);
        } catch (error) {
          console.error('Error fetching PO feedbacks:', error);
          return res.status(500).json({ error: 'Failed to fetch feedbacks' });
        }

      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ error: 'Database connection failed' });
  }
}
