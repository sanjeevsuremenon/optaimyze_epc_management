import { connectToDatabase } from  "../../../../lib/mongoconnect";

const handler =  async (req, res) => {
  // handle different methods
  try {
    switch (req.method) {
        case "GET": {
          const { db } = await connectToDatabase();
          const inventory = await db.collection("completestock").aggregate([
            {
                $group:{_id:"$plant-code", count:{$sum:"$current-stkval"}}
            }
          ]).toArray()
          return res.json(inventory);
          
        }         

        default:
          return res.json({ error: "Method not supported" });
      }
    
  } catch (error) {
    console.log(error)
  }
  
}
export default handler  