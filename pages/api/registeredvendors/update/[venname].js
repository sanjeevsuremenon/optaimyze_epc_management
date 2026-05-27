import { connectToDatabase } from "../../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { venname } = req.query;
  const { db } = await connectToDatabase();
  console.log(venname)
  console.log(req.query)

  try {
    switch (req.method) {
      case "GET": {
        const vendor = await db
          .collection("registeredvendors")
          .findOne({ "vendorname": venname }) || {}

        return res.json(vendor);
      }
     
      case "PUT": {
        // Contact-only updates from dashboard: do not $set vendorname/vendorcode from body
        // (those fields are absent and would clear the document).
        const contact = {
          telephone1: req.body.telephone1 ?? '',
          telephone2: req.body.telephone2 ?? '',
          salesname: req.body.salesname ?? '',
          salesemail: req.body.salesemail ?? '',
          salesmobile: req.body.salesmobile ?? '',
          fax: req.body.fax ?? ''
        };

        const setDoc = {
          contact,
          updatedBy: req.body.username,
          updatedAt: new Date()
        };

        const optionalTopLevel = [
          ['companyregistrationnumber', 'companyregnumber'],
          ['taxnumber', 'taxnumber'],
          ['companyemail', 'email'],
          ['companywebsite', 'website'],
          ['created_date', 'created_date'],
          ['created_by', 'created_by']
        ];
        for (const [key, bodyKey] of optionalTopLevel) {
          if (req.body[bodyKey] !== undefined && req.body[bodyKey] !== null) {
            setDoc[key] = req.body[bodyKey];
          }
        }

        if (
          req.body.city !== undefined ||
          req.body.countrycode !== undefined ||
          req.body.address1 !== undefined ||
          req.body.address2 !== undefined ||
          req.body.pobox !== undefined ||
          req.body.zipcode !== undefined
        ) {
          setDoc.address = {
            city: req.body.city,
            countrycode: req.body.countrycode,
            address1: req.body.address1,
            address2: req.body.address2,
            pobox: req.body.pobox,
            zipcode: req.body.zipcode
          };
        }

        if (req.body.vendorName !== undefined && req.body.vendorName !== null) {
          setDoc.vendorname = req.body.vendorName;
        }
        if (req.body.vendorcode !== undefined && req.body.vendorcode !== null) {
          setDoc.vendorcode = req.body.vendorcode;
        }

        const result = await db.collection('registeredvendors').updateOne(
          { vendorname: venname },
          { $set: setDoc }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: 'Vendor not found' });
        }

        return res.status(200).json({
          message: 'Vendor updated',
          modifiedCount: result.modifiedCount
        });
      }

      default:
        return res.status(405).json({ error: 'Method not supported' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export default handler;
