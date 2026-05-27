import { connectToDatabase } from "../../../../lib/mongoconnect";

const handler = async (req, res) => {
  // handle different methods
  try {
    switch (req.method) {
      case "GET": {
        const { vendorid } = req.query;
        const { db } = await connectToDatabase();
        // const vendorpolist = await db
        //   .collection("vendorsandtheirpo")
        //   .find({"vendorpo":{ $not: { $size: 0 } }})
        //   .toArray()

        const vendorpolist = await db.collection("vendorsandtheirpo").find({'vendor-code': vendorid}).toArray()

        return res.json(vendorpolist)
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};
export default handler;
