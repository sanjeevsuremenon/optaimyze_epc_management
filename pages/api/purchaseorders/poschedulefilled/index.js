import { connectToDatabase } from  "../../../../lib/mongoconnect";

const handler =  async (req, res) => {
  // handle different methods

    try {
    switch (req.method) {
        case "GET": {
          const { db } = await connectToDatabase();
          const polistschfilled = await db.collection("poschedule").find({}).toArray();
          return res.json(polistschfilled);
          
        } 
      
        default:
          return res.json({ error: "Method not supported" });
      }
    
  } catch (error) {
    console.log(error)
  }
  
}
export default handler  