import { connectToDatabase } from  "../../../lib/mongoconnect";

const handler =  async (req, res) => {
  // handle different methods

  let limit = 50
  let skip = 12
  try {
    switch (req.method) {
        case "GET": {
          const { db } = await connectToDatabase();
          const polist = await db.collection("purchaseorders").find({}).sort({"po-date":-1}).limit(limit).skip(skip).toArray();
          return res.json(polist);
          
        } 
      
        default:
          return res.json({ error: "Method not supported" });
      }
    
  } catch (error) {
    console.log(error)
  }
  
}
export default handler  