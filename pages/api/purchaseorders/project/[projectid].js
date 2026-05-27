import { connectToDatabase } from "../../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { projectid } = req.query;
  const { db } = await connectToDatabase();

  try {
    switch (req.method) {
      case "GET": {       
        
        const purchaseorders = await db
          .collection("purchaseorders")
          .find(
            {$expr: {
              $eq: [{ $substr: ["$account.wbs", 0, 12] }, projectid]
            }
            } 
          ).toArray()
          
          return  res.json(purchaseorders);
      }  
      
      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};

export default handler;
