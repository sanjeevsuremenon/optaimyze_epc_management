import { connectToDatabase } from '../../../lib/mongoconnect';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { vendorId } = req.body;

    if (!vendorId || !ObjectId.isValid(vendorId)) {
      return res.status(400).json({ error: 'Valid vendorId (ObjectId) is required' });
    }

    const { db } = await connectToDatabase();
    
    // Check if the vendor already has a code
    const vendor = await db.collection('registeredvendors').findOne({ _id: new ObjectId(vendorId) });
    
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    if (vendor.vendorcode && vendor.vendorcode.startsWith('NON')) {
      return res.status(200).json({ vendorcode: vendor.vendorcode });
    }

    // Find the highest existing NON code
    const highestVendor = await db.collection('registeredvendors')
      .find({ vendorcode: { $regex: /^NON\d{5}$/ } })
      .sort({ vendorcode: -1 })
      .limit(1)
      .toArray();

    let nextSequence = 1;
    if (highestVendor.length > 0 && highestVendor[0].vendorcode) {
      const highestCode = highestVendor[0].vendorcode;
      const numPart = parseInt(highestCode.replace('NON', ''), 10);
      if (!isNaN(numPart)) {
        nextSequence = numPart + 1;
      }
    }

    const newVendorCode = `NON${String(nextSequence).padStart(5, '0')}`;

    // Update the vendor
    await db.collection('registeredvendors').updateOne(
      { _id: new ObjectId(vendorId) },
      { $set: { vendorcode: newVendorCode } }
    );

    return res.status(200).json({ vendorcode: newVendorCode });
  } catch (error) {
    console.error('Error generating vendor code:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
