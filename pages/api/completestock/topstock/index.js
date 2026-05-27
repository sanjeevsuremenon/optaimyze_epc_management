import { connectToDatabase } from "../../../../lib/mongoconnect";

const handler = async (req, res) => {
  // handle different methods
  try {
    switch (req.method) {
      case "GET": {
        const { db } = await connectToDatabase();
        const stock = await db
          .collection("stockwithmatgroup")
          .aggregate([
           
            {
              $group: {
                _id: "$result.material-group" ,
                count: { $sum: "$current-stkval" },
              },
            },
          ])
          .toArray();
        return res.json(stock);
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};
export default handler;
