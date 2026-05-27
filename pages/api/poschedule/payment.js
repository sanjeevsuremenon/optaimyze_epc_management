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
          paymentdata: result?.paymentdata || null
        });
      } catch (dbError) {
        console.error('Database query error:', dbError);
        return res.status(500).json({ success: false, message: 'Database query failed' });
      }
    }

    if (req.method === 'POST') {
      const { ponumber, paymentdata } = req.body;

      if (!ponumber) {
        return res.status(400).json({ success: false, message: 'PO number is required' });
      }

      if (!paymentdata) {
        return res.status(400).json({ success: false, message: 'Payment data is required' });
      }

      try {
        const cleanedPaymentData = Object.fromEntries(
          Object.entries(paymentdata).map(([key, value]) => [
            key,
            value === '' ? null : value
          ])
        );

        // Enforce date type for all date fields in paymentdata
        // Assuming advancePayments and milestonePayments are arrays of objects with date fields, and finalPayment has a date field
        if (Array.isArray(cleanedPaymentData.advancePayments)) {
          cleanedPaymentData.advancePayments = cleanedPaymentData.advancePayments.map(payment => {
            if (payment.date && typeof payment.date === 'string') {
              const d = new Date(payment.date);
              if (!isNaN(d)) payment.date = d;
            }
            if (payment.requesteddate && typeof payment.requesteddate === 'string') {
              const d = new Date(payment.requesteddate);
              if (!isNaN(d)) payment.requesteddate = d;
            }
            return payment;
          });
        }
        if (Array.isArray(cleanedPaymentData.milestonePayments)) {
          cleanedPaymentData.milestonePayments = cleanedPaymentData.milestonePayments.map(payment => {
            if (payment.date && typeof payment.date === 'string') {
              const d = new Date(payment.date);
              if (!isNaN(d)) payment.date = d;
            }
            if (payment.requesteddate && typeof payment.requesteddate === 'string') {
              const d = new Date(payment.requesteddate);
              if (!isNaN(d)) payment.requesteddate = d;
            }
            return payment;
          });
        }
        if (cleanedPaymentData.finalPayment && typeof cleanedPaymentData.finalPayment.date === 'string') {
          const d = new Date(cleanedPaymentData.finalPayment.date);
          if (!isNaN(d)) cleanedPaymentData.finalPayment.date = d;
        }
        if (cleanedPaymentData.finalPayment && typeof cleanedPaymentData.finalPayment.requesteddate === 'string') {
          const d = new Date(cleanedPaymentData.finalPayment.requesteddate);
          if (!isNaN(d)) cleanedPaymentData.finalPayment.requesteddate = d;
        }

        const result = await collection.updateOne(
          { ponumber },
          {
            $set: { paymentdata: cleanedPaymentData }
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