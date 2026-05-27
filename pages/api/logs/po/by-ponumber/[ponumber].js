import { connectToDatabase } from '../../../../../lib/mongoconnect';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ponumber } = req.query;
    
    if (!ponumber) {
      return res.status(400).json({ error: 'PO number is required' });
    }

    const { db } = await connectToDatabase();
    const logs = await db
      .collection('pologs')
      .find({ poNumber: ponumber })
      .sort({ createdDate: -1 })
      .toArray();
    
    return res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching PO logs:', error);
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
}
