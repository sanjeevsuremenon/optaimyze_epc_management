import { connectToDatabase } from "../../../../../../lib/mongoconnect";

const handler = async (req, res) => {
  // handle different methods
  try {
    switch (req.method) {
      case "GET": {
        const { db } = await connectToDatabase();
        const poVendorwise = await db
          .collection("purchaseorders")
          .aggregate([
            {
              $group: { _id: "$vendorname", count: { $sum: "$po-value-sar" } },
            },
            
          ])
          .toArray();

          
        return res.json(poVendorwise);
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};
export default handler;
