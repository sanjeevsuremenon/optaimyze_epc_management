import { connectToDatabase } from "../../../../../lib/mongoconnect";

const handler = async (req, res) => {
  // handle different methods
  try {
    switch (req.method) {
      case "GET": {
        const { db } = await connectToDatabase();
        const poTypewise = await db
          .collection("purchaseorders")
          .aggregate([
            {
              $addFields: {
                mattype: {
                  $substr: ["$po-number", 0,2] ,
                },
              },
            },
            {
              $group: { _id: "$mattype", count: { $sum: "$po-value-sar" } },
            },
            
          ])
          .toArray();

          
        return res.json(poTypewise);
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};
export default handler;
