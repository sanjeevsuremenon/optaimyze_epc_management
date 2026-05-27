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
          progressdata: result?.progressdata || null
        });
      } catch (dbError) {
        console.error('Database query error:', dbError);
        return res.status(500).json({ success: false, message: 'Database query failed' });
      }
    }

    if (req.method === 'POST') {
      const { ponumber, progressdata } = req.body;

      if (!ponumber) {
        return res.status(400).json({ success: false, message: 'PO number is required' });
      }

      if (!progressdata) {
        return res.status(400).json({ success: false, message: 'Progress data is required' });
      }

      try {
        const cleanedProgressData = Object.fromEntries(
          Object.entries(progressdata).map(([key, value]) => [
            key,
            value === '' ? null : value
          ])
        );

        // Enforce date type for all date fields in progressdata
        [
          'mfgstart',
          'Bldate',
          'Fatdate',
          'Fatreportdate',
          'vesselreacheddate',
          'customscleareddate'
        ].forEach(field => {
          if (
            cleanedProgressData[field] &&
            typeof cleanedProgressData[field] === 'string'
          ) {
            const d = new Date(cleanedProgressData[field]);
            if (!isNaN(d)) cleanedProgressData[field] = d;
          }
        });

        const result = await collection.updateOne(
          { ponumber },
          {
            $set: { progressdata: cleanedProgressData }
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