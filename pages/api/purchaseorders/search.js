import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  try {
    switch (req.method) {
      case "GET": {
        const { db } = await connectToDatabase();
        const str = req.query.str;
        
        let condition = {};
        if (str) {
          condition = { "po-number": { $regex: str, $options: 'i' } };
        }
        
        const poList = await db
          .collection("purchaseorders")
          .find(condition)
          .sort({ "po-date": -1 })
          .limit(50)
          .toArray();
          
        return res.json(poList);
      }
      
      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default handler; 