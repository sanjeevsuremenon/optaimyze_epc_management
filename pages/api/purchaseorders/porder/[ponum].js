import { connectToDatabase } from "../../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { ponum } = req.query;
  const { db } = await connectToDatabase();

  try {
    switch (req.method) {
      case "GET": {       
        
        const polist = await db
          .collection("purchaseorders")
          .find({ "po-number": ponum }).toArray();
          
        return res.json(polist);
      }  
      
      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};

export default handler;
