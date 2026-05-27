import { connectToDatabase } from '../../../../lib/mongoconnect';

/**
 * Comma-separated env overrides the default search order (first match wins for reads;
 * new documents are written to the first name in the list).
 * Default primary collection: vendorsdata.
 */
const DEFAULT_COLLECTION_CANDIDATES = [
  'vendorsdata',
  'vendor_profile_overview',
];

function getOverviewCollectionNames() {
  const raw = process.env.VENDOR_OVERVIEW_COLLECTION?.trim();
  if (raw) {
    return [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))];
  }
  return [...DEFAULT_COLLECTION_CANDIDATES];
}

function vendorCodeVariants(vendorcode) {
  const trimmed = String(vendorcode).replace(/\s+/g, '');
  const set = new Set([vendorcode, trimmed]);
  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed);
    if (!Number.isNaN(n)) set.add(n);
    set.add(String(n));
  }
  return [...set];
}

function vendorCodeHyphenFilter(vendorcode) {
  const list = vendorCodeVariants(vendorcode);
  if (list.length === 1) return { 'vendor-code': list[0] };
  return { $or: list.map((c) => ({ 'vendor-code': c })) };
}

/** Accept hyphen keys, camelCase, or legacy underscore keys from various import tools. */
function normalizeOverviewFields(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  const out = { ...doc };
  if (out['vendor-code'] == null && out.vendorCode != null) out['vendor-code'] = out.vendorCode;
  if (out['vendor-name'] == null && out.vendorName != null) out['vendor-name'] = out.vendorName;
  if (out['contact-info'] == null && out.contactInfo != null) out['contact-info'] = out.contactInfo;
  if (out['services-and-materials'] == null && out.servicesAndMaterials != null) {
    out['services-and-materials'] = out.servicesAndMaterials;
  }
  if (out['contact-info'] == null && out.contact_info != null) out['contact-info'] = out.contact_info;
  if (out['services-and-materials'] == null && out.services_and_materials != null) {
    out['services-and-materials'] = out.services_and_materials;
  }
  return out;
}

function stripDoc(doc) {
  if (!doc) return null;
  const normalized = normalizeOverviewFields(doc);
  const { _id, ...rest } = normalized;
  return { ...rest, _id: _id?.toString?.() };
}

function vendorsOverviewFilter(vendorcode) {
  const codeFilter = vendorCodeHyphenFilter(vendorcode);
  const codeClause = codeFilter.$or ? { $or: codeFilter.$or } : codeFilter;
  return {
    $and: [
      codeClause,
      {
        $or: [
          { 'services-and-materials': { $exists: true, $ne: '' } },
          { 'contact-info': { $exists: true, $ne: '' } },
        ],
      },
    ],
  };
}

async function findOverviewDoc(db, vendorcode) {
  const filter = vendorCodeHyphenFilter(vendorcode);
  for (const name of getOverviewCollectionNames()) {
    const doc = await db.collection(name).findOne(filter);
    if (doc) return { doc, collectionName: name };
  }
  if (process.env.VENDOR_OVERVIEW_SKIP_VENDORS_FALLBACK === '1') {
    return { doc: null, collectionName: null };
  }
  const vendorsDoc = await db.collection('vendors').findOne(vendorsOverviewFilter(vendorcode));
  if (vendorsDoc) return { doc: vendorsDoc, collectionName: 'vendors' };
  return { doc: null, collectionName: null };
}

export default async function handler(req, res) {
  const { vendorcode } = req.query;

  if (!vendorcode) {
    return res.status(400).json({ error: 'Vendor code is required' });
  }

  try {
    const { db } = await connectToDatabase();
    const filter = vendorCodeHyphenFilter(vendorcode);

    if (req.method === 'GET') {
      const { doc } = await findOverviewDoc(db, vendorcode);
      if (!doc) {
        return res.status(200).json(null);
      }
      return res.status(200).json(stripDoc(doc));
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body || {};
      let { doc: existing, collectionName } = await findOverviewDoc(db, vendorcode);
      const names = getOverviewCollectionNames();
      const primaryWriteCollection = names[0] || 'vendorsdata';
      const collection = existing
        ? db.collection(collectionName)
        : db.collection(primaryWriteCollection);

      const payload = {
        'vendor-name': body['vendor-name'] ?? body.vendorName ?? existing?.['vendor-name'] ?? '',
        website: typeof body.website === 'string' ? body.website.trim() : existing?.website ?? '',
        'contact-info':
          typeof body['contact-info'] === 'string'
            ? body['contact-info'].trim()
            : typeof body.contactInfo === 'string'
              ? body.contactInfo.trim()
              : existing?.['contact-info'] ?? '',
        'services-and-materials':
          typeof body['services-and-materials'] === 'string'
            ? body['services-and-materials'].trim()
            : typeof body.servicesAndMaterials === 'string'
              ? body.servicesAndMaterials.trim()
              : existing?.['services-and-materials'] ?? '',
        updated_at: new Date(),
      };

      let saved;
      if (existing) {
        await collection.updateOne({ _id: existing._id }, { $set: payload });
        saved = await collection.findOne({ _id: existing._id });
      } else {
        const newCode = String(vendorcode).replace(/\s+/g, '');
        const insertDoc = {
          'vendor-code': newCode,
          ...payload,
          created_at: new Date(),
        };
        await collection.insertOne(insertDoc);
        saved = await collection.findOne(vendorCodeHyphenFilter(vendorcode));
      }

      return res.status(200).json({ message: 'Vendor overview saved', doc: stripDoc(saved) });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in vendors/overview handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
