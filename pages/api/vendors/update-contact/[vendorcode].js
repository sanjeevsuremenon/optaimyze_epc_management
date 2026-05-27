import { connectToDatabase } from '../../../../lib/mongoconnect';

function vendorCodeVariants(vendorcode) {
  const trimmed = String(vendorcode).replace(/\s+/g, '');
  const variants = new Set([vendorcode, trimmed]);
  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed);
    if (!Number.isNaN(n)) variants.add(n);
  }
  return [...variants];
}

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { vendorcode } = req.query;
    if (!vendorcode) {
      return res.status(400).json({ error: 'Vendor code is required' });
    }

    const {
      telephone1,
      telephone2,
      fax,
      salesname,
      salesemail,
      salesmobile,
      username
    } = req.body || {};

    const contact = {
      telephone1: telephone1 ?? '',
      telephone2: telephone2 ?? '',
      fax: fax ?? '',
      salesname: salesname ?? '',
      salesemail: salesemail ?? '',
      salesmobile: salesmobile ?? ''
    };

    const { db } = await connectToDatabase();
    const codes = vendorCodeVariants(vendorcode);
    const meta = {
      updated_at: new Date(),
      updated_by: username || 'admin'
    };

    const [vendorsResult, registeredResult] = await Promise.all([
      db.collection('vendors').updateOne(
        { 'vendor-code': { $in: codes } },
        { $set: { contact, ...meta } }
      ),
      db.collection('registeredvendors').updateOne(
        { vendorcode: { $in: codes } },
        { $set: { contact, updatedAt: meta.updated_at, updatedBy: meta.updated_by } }
      )
    ]);

    const anyMatched =
      vendorsResult.matchedCount > 0 || registeredResult.matchedCount > 0;

    if (!anyMatched) {
      return res.status(404).json({ error: 'Vendor not found in vendors or registeredvendors' });
    }

    return res.status(200).json({
      message: 'Contact updated successfully',
      vendorsModified: vendorsResult.modifiedCount,
      registeredModified: registeredResult.modifiedCount
    });
  } catch (error) {
    console.error('Error updating vendor contact:', error);
    return res.status(500).json({
      error: 'Failed to update contact',
      details: error.message
    });
  }
}
