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
          shipdata: result?.shipdata || null
        });
      } catch (dbError) {
        console.error('Database query error:', dbError);
        return res.status(500).json({ success: false, message: 'Database query failed' });
      }
    }

    if (req.method === 'POST') {
      const { ponumber, shipdata } = req.body;

      if (!ponumber) {
        return res.status(400).json({ success: false, message: 'PO number is required' });
      }

      if (!shipdata) {
        return res.status(400).json({ success: false, message: 'Shipment data is required' });
      }

      try {
        const cleanedShipData = Object.fromEntries(
          Object.entries(shipdata).map(([key, value]) => [
            key,
            value === '' ? null : value
          ])
        );

        // Enforce date type for all date fields in shipdata
        [
          'shipmentbookeddate',
          'saberapplieddate',
          'saberreceiveddate',
          'ffnoMinateddate'
        ].forEach(field => {
          if (
            cleanedShipData[field] &&
            typeof cleanedShipData[field] === 'string'
          ) {
            const d = new Date(cleanedShipData[field]);
            if (!isNaN(d)) cleanedShipData[field] = d;
          }
        });

        const result = await collection.updateOne(
          { ponumber },
          {
            $set: { shipdata: cleanedShipData }
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