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
        console.log('GET result:', result); // Debug log
        
        return res.status(200).json({
          success: true,
          generaldata: result?.generaldata || null
        });
      } catch (dbError) {
        console.error('Database query error:', dbError);
        return res.status(500).json({ success: false, message: 'Database query failed' });
      }
    }

    if (req.method === 'POST') {
      const { ponumber, generaldata } = req.body;

      if (!ponumber) {
        return res.status(400).json({ success: false, message: 'PO number is required' });
      }

      if (!generaldata) {
        return res.status(400).json({ success: false, message: 'General data is required' });
      }

      try {
        // Clean the data before saving
        const cleanedGeneralData = Object.fromEntries(
          Object.entries(generaldata).map(([key, value]) => [
            key,
            value === '' ? null : value
          ])
        );

        // Enforce date type for podelydate and estdelydate
        ['podelydate', 'estdelydate'].forEach(field => {
          if (
            cleanedGeneralData[field] &&
            typeof cleanedGeneralData[field] === 'string'
          ) {
            const d = new Date(cleanedGeneralData[field]);
            if (!isNaN(d)) cleanedGeneralData[field] = d;
          }
        });

        const result = await collection.updateOne(
          { ponumber },
          {
            $set: { generaldata: cleanedGeneralData }
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