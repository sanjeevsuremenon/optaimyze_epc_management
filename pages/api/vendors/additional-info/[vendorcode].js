import { connectToDatabase } from '../../../../lib/mongoconnect';

function vendorCodeVariants(vendorcode) {
  const trimmed = String(vendorcode).replace(/\s+/g, '');
  const set = new Set([vendorcode, trimmed]);
  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed);
    if (!Number.isNaN(n)) set.add(n);
  }
  return [...set];
}

function vendorCodeFilter(vendorcode) {
  const list = vendorCodeVariants(vendorcode);
  if (list.length === 1) return { vendorCode: list[0] };
  return { $or: list.map((c) => ({ vendorCode: c })) };
}

export default async function handler(req, res) {
  const { vendorcode } = req.query;

  if (!vendorcode) {
    return res.status(400).json({ error: 'Vendor code is required' });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('vendor_additional_info');
    const filter = vendorCodeFilter(vendorcode);

    if (req.method === 'GET') {
      const doc = await collection.findOne(filter);
      return res.status(200).json(doc || {});
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body || {};
      const existing = await collection.findOne(filter);
      const canonicalVendorCode =
        existing?.vendorCode != null ? existing.vendorCode : String(vendorcode).replace(/\s+/g, '');

      const payload = {
        vendorCode: canonicalVendorCode,
        companyTypes: Array.isArray(body.companyTypes) ? body.companyTypes : [],
        yearEstablished: body.yearEstablished || '',
        companyLegalType: body.companyLegalType || '',
        companyLegalTypeOther: body.companyLegalTypeOther || '',
        numEmployees: typeof body.numEmployees === 'number' ? body.numEmployees : Number(body.numEmployees) || 0,
        numTechnicalStaff: typeof body.numTechnicalStaff === 'number' ? body.numTechnicalStaff : Number(body.numTechnicalStaff) || 0,
        numSkilledLabor: typeof body.numSkilledLabor === 'number' ? body.numSkilledLabor : Number(body.numSkilledLabor) || 0,
        numUnskilledLabor: typeof body.numUnskilledLabor === 'number' ? body.numUnskilledLabor : Number(body.numUnskilledLabor) || 0,
        annualTurnoverAvgSAR: typeof body.annualTurnoverAvgSAR === 'number' ? body.annualTurnoverAvgSAR : Number(body.annualTurnoverAvgSAR) || 0,
        financialReferences: Array.isArray(body.financialReferences) ? body.financialReferences : [],
        clientReferences: Array.isArray(body.clientReferences) ? body.clientReferences : [],
        totalAreaSqm: typeof body.totalAreaSqm === 'number' ? body.totalAreaSqm : Number(body.totalAreaSqm) || 0,
        remarks: body.remarks || '',
        updated_at: new Date(),
      };

      await collection.updateOne(
        filter,
        { $set: payload, $setOnInsert: { created_at: new Date() } },
        { upsert: true }
      );

      return res.status(200).json({ message: 'Additional info saved' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in additional-info handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


