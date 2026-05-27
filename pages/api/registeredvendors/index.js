import { connectToDatabase } from "../../../lib/mongoconnect";
import { ObjectId } from 'mongodb';

const handler = async (req, res) => {
  try {
    switch (req.method) {
      case "GET": {
        const { db } = await connectToDatabase();
        const { search } = req.query;

        let query = {};
        if (search && search.length >= 4) {
          query = {
            vendorname: { $regex: search, $options: 'i' }
          };
        }

        const vendorlist = await db.collection("registeredvendors").find(query).toArray();
        return res.json(vendorlist);
      }

      case "POST": {
        const { db } = await connectToDatabase();
        const newvendor = await db.collection("registeredvendors").insertOne({
          vendorname: req.body.vendorName,
          taxnumber: req.body.taxnumber,
          companyregistrationnumber: req.body.registrationnumber,
          companyemail: req.body.email,              
          companywebsite: req.body.webaddress,
          created_by:"admin",
          created_at: new Date(),
          address: {
            city: req.body.vendorCity,
            countrycode: req.body.vendorCountry,
            address1: req.body.address1,
            address2: req.body.address2,
            pobox: req.body.pobox,
            zipcode: req.body.zipcode,
          },
          contact:{
            telephone1: req.body.telephone1,
            telephone2: req.body.telephone2,
            salesname: req.body.salesperson,
            salesemail: req.body.salesemail,
            salesmobile: req.body.salesmobile,
            fax: req.body.faxnumber,
          }
        });
        return res.status(201).json(newvendor);
      }

      

      case "PUT": {
        const { db } = await connectToDatabase();
        const { _id, ...updateData } = req.body;

        const updateFields = {
          vendorname: updateData.vendorname,
          address: {
            countrycode: updateData.countrycode,
            city: updateData.city,
            address1: updateData.address1,
            address2: updateData.address2,
            pobox: updateData.pobox,
            zipcode: updateData.zipcode,
          },
          contact: {
            telephone1: updateData.telephone1,
            telephone2: updateData.telephone2,
            salesname: updateData.salesname,
            salesemail: updateData.salesemail,
            salesmobile: updateData.salesmobile,
            fax: updateData.fax,
          },
          companyregistrationnumber: updateData.companyregistrationnumber,
          companyemail: updateData.companyemail,
          vendorcode: updateData.vendorcode,
          companywebsite: updateData.companywebsite,
        };

        await db.collection("registeredvendors").updateOne(
          { _id: ObjectId(_id) },
          { $set: updateFields }
        );
        return res.status(200).json({ _id, ...updateFields });
      }


      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default handler;