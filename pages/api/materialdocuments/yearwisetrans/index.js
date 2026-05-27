import { connectToDatabase } from  "../../../../lib/mongoconnect";

const handler =  async (req, res) => {
  // handle different methods
  try {
    switch (req.method) {
        case "GET": {
          const { db } = await connectToDatabase();
          const trans = await db.collection("materialdocuments").aggregate([
            {
                $group:{_id:{$year:"$doc-date"}, count:{$sum:"$doc-amount"}}
            }
          ]).sort({"_id": 1}).toArray()
          return res.json(trans);
          
        }         

        default:
          return res.json({ error: "Method not supported" });
      }
    
  } catch (error) {
    console.log(error)
  }
  
}
export default handler  