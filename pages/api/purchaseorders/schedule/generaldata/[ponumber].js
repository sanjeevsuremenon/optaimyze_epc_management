import { connectToDatabase } from "../../../../../lib/mongoconnect";

// Helper function to convert date strings to Date objects
const convertDatesToObjects = (data) => {
  if (!data) return data;
  
  const result = { ...data };
  
  // Convert dates in generaldata
  if (result.generaldata) {
    Object.keys(result.generaldata).forEach(key => {
      if (result.generaldata[key] && typeof result.generaldata[key] === 'string' && !isNaN(Date.parse(result.generaldata[key]))) {
        result.generaldata[key] = new Date(result.generaldata[key]);
      }
    });
  }

  // Convert dates in paymentdata
  if (result.paymentdata) {
    // Handle old paymentdata structure (flat object) and convert to new structure
    if (result.paymentdata.advpaiddate || result.paymentdata.advamountpaid || 
        result.paymentdata.milestoneamountpaiddate || result.paymentdata.milestoneamountpaid ||
        result.paymentdata.finalpaiddate || result.paymentdata.finalpaidamt) {
      
      // Convert old structure to new structure
      const newPaymentData = {
        advancePayments: [],
        milestonePayments: [],
        finalPayment: { requesteddate: null, date: null, amount: '', comments: '' }
      };

      // Convert advance payment data
      if (result.paymentdata.advpaiddate || result.paymentdata.advamountpaid) {
        newPaymentData.advancePayments.push({
          date: result.paymentdata.advpaiddate && !isNaN(Date.parse(result.paymentdata.advpaiddate)) 
            ? new Date(result.paymentdata.advpaiddate) 
            : null,
          amount: result.paymentdata.advamountpaid || '',
          id: 1
        });
      }

      // Convert milestone payment data
      if (result.paymentdata.milestoneamountpaiddate || result.paymentdata.milestoneamountpaid) {
        newPaymentData.milestonePayments.push({
          date: result.paymentdata.milestoneamountpaiddate && !isNaN(Date.parse(result.paymentdata.milestoneamountpaiddate)) 
            ? new Date(result.paymentdata.milestoneamountpaiddate) 
            : null,
          amount: result.paymentdata.milestoneamountpaid || '',
          id: 1
        });
      }

      // Convert final payment data
      if (result.paymentdata.finalpaiddate || result.paymentdata.finalpaidamt || result.paymentdata.finalcomments) {
        newPaymentData.finalPayment = {
          requesteddate: null,
          date: result.paymentdata.finalpaiddate && !isNaN(Date.parse(result.paymentdata.finalpaiddate)) 
            ? new Date(result.paymentdata.finalpaiddate) 
            : null,
          amount: result.paymentdata.finalpaidamt || '',
          comments: result.paymentdata.finalcomments || ''
        };
      }

      result.paymentdata = newPaymentData;
    } else {
      // Handle new paymentdata structure (arrays and objects)
      if (result.paymentdata.advancePayments) {
        result.paymentdata.advancePayments = result.paymentdata.advancePayments.map(payment => {
          if (!payment) return null;
          return {
            ...payment,
            date: payment.date && !isNaN(Date.parse(payment.date)) ? new Date(payment.date) : null,
            requesteddate: payment.requesteddate && !isNaN(Date.parse(payment.requesteddate)) ? new Date(payment.requesteddate) : null
          };
        }).filter(Boolean);
      }
      if (result.paymentdata.milestonePayments) {
        result.paymentdata.milestonePayments = result.paymentdata.milestonePayments.map(payment => {
          if (!payment) return null;
          return {
            ...payment,
            date: payment.date && !isNaN(Date.parse(payment.date)) ? new Date(payment.date) : null,
            requesteddate: payment.requesteddate && !isNaN(Date.parse(payment.requesteddate)) ? new Date(payment.requesteddate) : null
          };
        }).filter(Boolean);
      }
      if (result.paymentdata.finalPayment) {
        result.paymentdata.finalPayment = {
          ...result.paymentdata.finalPayment,
          date: result.paymentdata.finalPayment.date && !isNaN(Date.parse(result.paymentdata.finalPayment.date)) 
            ? new Date(result.paymentdata.finalPayment.date) 
            : null,
          requesteddate: result.paymentdata.finalPayment.requesteddate && !isNaN(Date.parse(result.paymentdata.finalPayment.requesteddate))
            ? new Date(result.paymentdata.finalPayment.requesteddate)
            : null
        };
      }
    }
  }

  // Convert dates in bgdata (excluding numeric fields)
  if (result.bgdata) {
    const numericFields = ['abgamount', 'pbgamount']; // Fields that should remain as numbers
    Object.keys(result.bgdata).forEach(key => {
      if (!numericFields.includes(key) && result.bgdata[key] && typeof result.bgdata[key] === 'string' && !isNaN(Date.parse(result.bgdata[key]))) {
        result.bgdata[key] = new Date(result.bgdata[key]);
      }
    });
  }

  // Convert dates in lcdata
  if (result.lcdata) {
    Object.keys(result.lcdata).forEach(key => {
      if (result.lcdata[key] && typeof result.lcdata[key] === 'string' && !isNaN(Date.parse(result.lcdata[key]))) {
        result.lcdata[key] = new Date(result.lcdata[key]);
      }
    });
  }

  // Convert dates in inspectiondata (tpiPoNumber is text)
  if (result.inspectiondata) {
    Object.keys(result.inspectiondata).forEach(key => {
      if (key === 'tpiPoNumber') return;
      if (result.inspectiondata[key] && typeof result.inspectiondata[key] === 'string' && !isNaN(Date.parse(result.inspectiondata[key]))) {
        result.inspectiondata[key] = new Date(result.inspectiondata[key]);
      }
    });
  }

  // Convert dates in progressdata
  if (result.progressdata) {
    Object.keys(result.progressdata).forEach(key => {
      if (result.progressdata[key] && typeof result.progressdata[key] === 'string' && !isNaN(Date.parse(result.progressdata[key]))) {
        result.progressdata[key] = new Date(result.progressdata[key]);
      }
    });
  }

  // Convert dates in shipdata
  if (result.shipdata) {
    Object.keys(result.shipdata).forEach(key => {
      if (result.shipdata[key] && typeof result.shipdata[key] === 'string' && !isNaN(Date.parse(result.shipdata[key]))) {
        result.shipdata[key] = new Date(result.shipdata[key]);
      }
    });
  }

  return result;
};

export default async function handler(req, res) {
  const { ponumber } = req.query;
  const { method } = req;

  console.log('API Request:', { method, ponumber });

  // Validate PO number
  if (!ponumber || ponumber === 'undefined') {
    console.error('Invalid PO number:', ponumber);
    return res.status(400).json({ message: 'Invalid PO number' });
  }

  try {
    const { db } = await connectToDatabase();

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    switch (method) {
      case 'GET':
        console.log('Fetching schedule data for PO:', ponumber);
        
        // Check if the collection exists
        const collectionExists = collections.some(c => c.name === 'poschedule');
        console.log('poschedule collection exists:', collectionExists);

        // Get count of documents in poschedule
        if (collectionExists) {
          const count = await db.collection('poschedule').countDocuments();
          console.log('Number of documents in poschedule:', count);
        }

        const scheduleData = await db.collection('poschedule').findOne({ ponumber });
        console.log('Found schedule data:', scheduleData);
        
        if (!scheduleData) {
          console.log('No schedule data found for PO:', ponumber);
          return res.status(404).json({ message: 'Schedule data not found' });
        }

        // Convert dates to ISO strings for JSON serialization
        const serializedData = JSON.parse(JSON.stringify(scheduleData));
        res.status(200).json(serializedData);
        break;

      case 'POST':
        console.log('Received POST data:', req.body);
        const {
          generaldata,
          paymentdata,
          bgdata,
          lcdata,
          inspectiondata,
          progressdata,
          shipdata
        } = req.body;

        // Convert all date strings to Date objects before saving
        const dataToSave = convertDatesToObjects({
          generaldata,
          paymentdata,
          bgdata,
          lcdata,
          inspectiondata,
          progressdata,
          shipdata
        });

        console.log('Data to save:', dataToSave);

        // Update or insert schedule data
        const updateResult = await db.collection('poschedule').updateOne(
          { ponumber },
          {
            $set: {
              ponumber,
              ...dataToSave,
              updatedAt: new Date(),
              updatedBy: req.body.user || 'System'
            }
          },
          { upsert: true }
        );

        console.log('Update result:', updateResult);

        // Verify the saved data
        const savedData = await db.collection('poschedule').findOne({ ponumber });
        console.log('Saved data:', savedData);

        res.status(200).json({ message: 'Schedule data updated successfully' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error in schedule API:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
