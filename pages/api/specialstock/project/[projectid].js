import { connectToDatabase } from "../../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { projectid } = req.query;
  const { db } = await connectToDatabase();

  try {
    switch (req.method) {
      case "GET": {       
        
        const specialstk = await db
          .collection("specialstock")
          .find(
            {$expr: {
              $eq: [{ $substr: ["$wbs-element", 0, 12] }, projectid]
            }
            } 
          ).sort({"stock-val":1}).toArray()
          
          return  res.json(specialstk);
      }  
      
      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};

export default handler;
