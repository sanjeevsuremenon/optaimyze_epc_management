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
          lcdata: result?.lcdata || null
        });
      } catch (dbError) {
        console.error('Database query error:', dbError);
        return res.status(500).json({ success: false, message: 'Database query failed' });
      }
    }

    if (req.method === 'POST') {
      const { ponumber, lcdata } = req.body;

      if (!ponumber) {
        return res.status(400).json({ success: false, message: 'PO number is required' });
      }

      if (!lcdata) {
        return res.status(400).json({ success: false, message: 'LC data is required' });
      }

      try {
        const cleanedLCData = Object.fromEntries(
          Object.entries(lcdata).map(([key, value]) => [
            key,
            value === '' ? null : value
          ])
        );

        // Enforce date type for all date fields in lcdata
        [
          'lcestopendate',
          'lcopeneddate',
          'lcdatadate',
          'lclastshipdate',
          'lcexpirydate'
        ].forEach(field => {
          if (
            cleanedLCData[field] &&
            typeof cleanedLCData[field] === 'string'
          ) {
            const d = new Date(cleanedLCData[field]);
            if (!isNaN(d)) cleanedLCData[field] = d;
          }
        });

        const result = await collection.updateOne(
          { ponumber },
          {
            $set: { lcdata: cleanedLCData }
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