import { connectToDatabase } from '../../../lib/mongoconnect';
import { ObjectId } from 'mongodb';

const PAGE_SIZE = 100;

function buildUpdateFields(body) {
  return {
    vendorname: body.vendorname,
    address: {
      countrycode: body.countrycode,
      city: body.city,
      address1: body.address1,
      address2: body.address2,
      pobox: body.pobox,
      zipcode: body.zipcode,
    },
    contact: {
      telephone1: body.telephone1,
      telephone2: body.telephone2,
      salesname: body.salesname,
      salesemail: body.salesemail,
      salesmobile: body.salesmobile,
      fax: body.fax,
    },
    companyregistrationnumber: body.companyregistrationnumber,
    companyemail: body.companyemail,
    vendorcode: body.vendorcode,
    companywebsite: body.companywebsite,
  };
}

function docFromLegacyPost(body) {
  return {
    vendorname: body.vendorName,
    taxnumber: body.taxnumber,
    companyregistrationnumber: body.registrationnumber,
    companyemail: body.email,
    companywebsite: body.webaddress,
    created_by: 'admin',
    created_at: new Date(),
    address: {
      city: body.vendorCity,
      countrycode: body.vendorCountry,
      address1: body.address1,
      address2: body.address2,
      pobox: body.pobox,
      zipcode: body.zipcode,
    },
    contact: {
      telephone1: body.telephone1,
      telephone2: body.telephone2,
      salesname: body.salesperson,
      salesemail: body.salesemail,
      salesmobile: body.salesmobile,
      fax: body.faxnumber,
    },
  };
}

export default async function handler(req, res) {
  try {
    const { db } = await connectToDatabase();

    switch (req.method) {
      case 'GET': {
        const limit = Math.min(
          Math.max(parseInt(req.query.limit, 10) || PAGE_SIZE, 1),
          500
        );
        const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);
        const { search } = req.query;

        let query = {};
        if (search && String(search).trim().length >= 4) {
          query = {
            vendorname: { $regex: String(search).trim(), $options: 'i' },
          };
        }

        const col = db.collection('nonsapvendors');
        const [total, vendors] = await Promise.all([
          col.countDocuments(query),
          col
            .find(query)
            .sort({ vendorname: 1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
        ]);

        const hasMore = skip + vendors.length < total;

        return res.status(200).json({
          vendors,
          total,
          hasMore,
          limit,
          skip,
        });
      }

      case 'POST': {
        const body = req.body || {};
        let doc;

        if (body.vendorName != null) {
          doc = docFromLegacyPost(body);
        } else if (body.vendorname != null) {
          doc = {
            vendorname: body.vendorname,
            address: body.address || {},
            contact: body.contact || {},
            companyregistrationnumber: body.companyregistrationnumber,
            companyemail: body.companyemail,
            vendorcode: body.vendorcode || '',
            companywebsite: body.companywebsite,
            taxnumber: body.taxnumber,
            created_at: new Date(),
          };
        } else {
          return res.status(400).json({ error: 'Invalid vendor payload' });
        }

        const result = await db.collection('nonsapvendors').insertOne(doc);
        const internalVendorCode = result.insertedId.toString();
        await db.collection('nonsapvendors').updateOne(
          { _id: result.insertedId },
          { $set: { internalVendorCode } }
        );

        const created = await db.collection('nonsapvendors').findOne({
          _id: result.insertedId,
        });
        return res.status(201).json(created);
      }

      case 'PUT': {
        const { _id, ...rest } = req.body;
        if (!_id) {
          return res.status(400).json({ error: '_id is required' });
        }

        const updateFields = buildUpdateFields(rest);
        await db.collection('nonsapvendors').updateOne(
          { _id: new ObjectId(_id) },
          { $set: updateFields }
        );

        return res.status(200).json({ _id, ...updateFields });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('nonsapvendors API:', error);
    return res.status(500).json({ error: error.message });
  }
}
