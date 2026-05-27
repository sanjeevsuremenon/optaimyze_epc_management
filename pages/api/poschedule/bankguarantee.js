import { connectToDatabase } from '../../../lib/mongoconnect';

export default async function handler(req, res) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('poschedule');

    if (req.method === 'GET') {
      const { ponumber } = req.query;
      
      if (!ponumber) {
        return res.status(400).json({ success: false, message: 'PO number is required' });
      }

      try {
        const result = await collection.findOne({ ponumber });
        
        return res.status(200).json({
          success: true,
          bgdata: result?.bgdata || null
        });
      } catch (dbError) {
        console.error('Database query error:', dbError);
        return res.status(500).json({ success: false, message: 'Database query failed' });
      }
    }

    if (req.method === 'POST') {
      const { ponumber, bgdata } = req.body;

      if (!ponumber) {
        return res.status(400).json({ success: false, message: 'PO number is required' });
      }

      if (!bgdata) {
        return res.status(400).json({ success: false, message: 'Bank Guarantee data is required' });
      }

      try {
        const cleanedBGData = Object.fromEntries(
          Object.entries(bgdata).map(([key, value]) => [
            key,
            value === '' ? null : value
          ])
        );

        // Enforce date type for all date fields in bgdata
        [
          'abgestdate',
          'abgactualdate',
          'abgexpirydate',
          'pbgestdate',
          'pbgactualdate',
          'pbgreturneddate',
          'abgreturneddate',
          'pbgexpirydate'
        ].forEach(field => {
          if (
            cleanedBGData[field] &&
            typeof cleanedBGData[field] === 'string'
          ) {
            const d = new Date(cleanedBGData[field]);
            if (!isNaN(d)) cleanedBGData[field] = d;
          }
        });

        const result = await collection.updateOne(
          { ponumber },
          {
            $set: { bgdata: cleanedBGData }
          },
          { upsert: true }
        );

        return res.status(200).json({
          success: true,
          message: result.upsertedCount > 0 ? 'Data inserted' : 'Data updated',
          data: result
        });
      } catch (dbError) {
        console.error('Database update error:', dbError);
        return res.status(500).json({ success: false, message: 'Database update failed' });
      }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
} 