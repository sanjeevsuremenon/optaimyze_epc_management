import { connectToDatabase } from '../../../../lib/mongoconnect';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { vendorcode } = req.query;
    const { db } = await connectToDatabase();
    const { vendorName, source } = req.query;

    if (!vendorcode) {
      return res.status(400).json({ error: 'Vendor code is required' });
    }

    // Resolve vendor document for header/details
      let vendor = null;
      let vendorDetails = null;
      let registeredVendorDetails = null;

      // If the request indicates registeredvendors and vendorName is present, try by name first
      if (source === 'registeredvendors' && vendorName) {
        registeredVendorDetails = await db.collection('registeredvendors').findOne({ vendorname: vendorName });
      }
      // Fallbacks by code
      if (!registeredVendorDetails) {
        [vendorDetails, registeredVendorDetails] = await Promise.all([
          db.collection('vendors').findOne({ 'vendor-code': vendorcode }),
          db.collection('registeredvendors').findOne({ vendorcode: vendorcode })
        ]);
      }

      vendor = vendorDetails || registeredVendorDetails;
      
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

    // Get purchase orders for this vendor
    let poSummary = {};
    let totalValue = 0;
    let poCount = 0;
    let poList = [];
    
    try {
      const purchaseOrders = await db.collection('purchaseorders')
        .find({ vendorcode: vendorcode })
        .toArray();


      // Process PO data
      purchaseOrders.forEach(po => {
        const poNumber = po['po-number'];
        if (!poSummary[poNumber]) {
          poSummary[poNumber] = {
            ponum: poNumber,
            podate: po['po-date'],
            vendor: po.vendorname || po['vendor-name'],
            poval: 0,
            balgrval: 0
          };
          poCount++;
        }
        poSummary[poNumber].poval += po['po-value-sar'] || 0;
        poSummary[poNumber].balgrval += po['pending-val-sar'] || 0;
        totalValue += po['po-value-sar'] || 0;
      });

      // Convert to array and sort by date (most recent first)
      poList = Object.values(poSummary).sort((a, b) => new Date(b.podate) - new Date(a.podate));
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      poSummary = {};
      totalValue = 0;
      poCount = 0;
      poList = [];
    }

    // Material/service subgroup mappings: vendorgroupmap (SAP or real code) or unregisteredvendorgroupmap (no SAP code)
    let groupDetails = [];
    let groupMappingsSource = 'vendorgroupmap';
    try {
      const groups = await db.collection('materialgroups').find({}).sort({ name: 1 }).toArray();
      const subgroupIdToInfo = new Map();
      for (const group of groups) {
        const subgroups = await db.collection('materialsubgroups')
          .find({ groupId: group._id })
          .sort({ name: 1 })
          .toArray();
        for (const subgroup of subgroups) {
          subgroupIdToInfo.set(String(subgroup._id), {
            groupName: group.name,
            subgroupName: subgroup.name,
            isService: !!group.isService
          });
        }
      }

      const vendorDisplayName = vendor['vendor-name'] || vendor.vendorname || vendorName || '';
      const regCode = registeredVendorDetails?.vendorcode;
      const useUnregisteredMappings =
        !vendorDetails &&
        (!regCode || regCode === 'NA');

      let mappingsData = [];
      if (useUnregisteredMappings && vendorDisplayName) {
        groupMappingsSource = 'unregistered';
        mappingsData = await db.collection('unregisteredvendorgroupmap')
          .find({ 'vendor-name': vendorDisplayName })
          .toArray();
      } else {
        const codeForMap = vendorDetails
          ? (vendorDetails['vendor-code'] ?? vendorcode)
          : (regCode && regCode !== 'NA' ? regCode : vendorcode);
        const trimmed = String(codeForMap).replace(/\s+/g, '');
        const variants = new Set([
          codeForMap,
          vendorcode,
          trimmed,
          String(codeForMap).toUpperCase(),
          String(vendorcode).toUpperCase(),
          trimmed.toUpperCase()
        ]);
        if (/^\d+$/.test(trimmed)) {
          const n = Number(trimmed);
          if (!Number.isNaN(n)) variants.add(n);
        }
        mappingsData = await db.collection('vendorgroupmap')
          .find({ vendorCode: { $in: [...variants] } })
          .toArray();
      }

      groupDetails = mappingsData
        .map((m) => {
          if (m.subgroupId == null) return null;
          const info = subgroupIdToInfo.get(String(m.subgroupId));
          if (!info) return null;
          return {
            mappingId: m._id,
            subgroupId: String(m.subgroupId),
            groupName: info.groupName,
            subgroupName: info.subgroupName,
            isService: info.isService
          };
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Error fetching group mappings:', error);
      groupDetails = [];
    }

    // Get vendor evaluation data - same as /vendorevaluation/webformat/[vendorcode]
    let evaluationMarks = null;
    let evaluationFixed = null;
    
    try {
      const [marksResult, fixedResult] = await Promise.all([
        db.collection('vendorevaluationmarks').findOne({ vendorcode: vendorcode }),
        db.collection('vendorevaluation').findOne({ vendorcode: vendorcode })
      ]);
      
      evaluationMarks = marksResult;
      evaluationFixed = fixedResult;
    } catch (error) {
      console.error('Error fetching evaluation data:', error);
      evaluationMarks = null;
      evaluationFixed = null;
    }

    // Get vendor documents (assuming they're stored with vendor reference)
    let documents = [];
    try {
      // Documents may use either vendorcode or vendorCode depending on uploader module
      documents = await db.collection('vendordocuments')
        .find({ $or: [ { vendorcode: vendorcode }, { vendorCode: vendorcode } ] })
        .toArray();
    } catch (error) {
      console.error('Error fetching documents:', error);
      documents = [];
    }

    // Prepare response with null safety
    let response;
    try {
      response = {
        vendor: vendor ? {
          // Standardize vendor data structure
          vendorname: vendor['vendor-name'] || vendor.vendorname || vendorName || 'N/A',
          vendorcode: vendor['vendor-code'] || vendor.vendorcode || vendorcode,
          address: vendor.address || {},
          contact: {
            ...vendor.contact,
            // Handle different field name variations
            telephone1: vendor.contact?.telephone1 || vendor.contact?.telelphone1,
            telephone2: vendor.contact?.telephone2,
            fax: vendor.contact?.fax,
            salesname: vendor.contact?.salesname,
            salesemail: vendor.contact?.salesemail,
            salesmobile: vendor.contact?.salesmobile
          },
          companyregistrationnumber: vendor.companyregistrationnumber,
          companyemail: vendor.companyemail,
          companywebsite: vendor.companywebsite,
          taxnumber: vendor.taxnumber,
          vatnumber: vendor['vat-number'] || vendor.vatnumber,
          created_date: vendor.created_date || vendor.created_at,
          created_by: vendor.created_by,
          source: vendorDetails ? 'vendors' : 'registeredvendors'
        } : null,
        poSummary: {
          totalValue: totalValue || 0,
          poCount: poCount || 0,
          poList: poList || []
        },
        groupMappings: groupDetails || [],
        groupMappingsSource,
        evaluation: {
          marks: evaluationMarks || null,
          fixed: evaluationFixed || null
        },
        documents: documents || []
      };


      return res.status(200).json(response);
    } catch (error) {
      console.error('Error preparing response:', error);
      return res.status(500).json({ 
        error: 'Failed to prepare vendor dashboard data',
        details: error.message 
      });
    }
  } catch (error) {
    console.error('Dashboard API error:', error);
    return res.status(500).json({ error: 'Failed to fetch vendor dashboard data' });
  }
}
