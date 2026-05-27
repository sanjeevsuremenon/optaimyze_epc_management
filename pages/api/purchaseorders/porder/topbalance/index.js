import { connectToDatabase } from "../../../../../lib/mongoconnect";

const handler = async (req, res) => {
  // handle different methods
  try {
    switch (req.method) {
      case "GET": {
        const { db } = await connectToDatabase();
        const poTopbalance = await db
          .collection("purchaseorders")
          .aggregate([
            {
              $group: { _id: {ponum: "$po-number", vendor: "$vendorcode", venname: "$vendorname"}, count: { $sum: "$pending-val-sar" } },
            },
            
          ])
          .toArray();

          
        return res.json(poTopbalance);
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};
export default handler;
