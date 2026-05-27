import { connectToDatabase } from  "../../../../lib/mongoconnect";

const handler =  async (req, res) => {
  // handle different methods
  try {
    switch (req.method) {
        case "GET": {
          const { db } = await connectToDatabase();
          const receipts = await db.collection("materialdocuments").aggregate([
            {
               $match:
               {
                'doc-amount':{
                  $gte:0.01
                }
               }
            },
            {
              $group: {_id:{$year:"$doc-date"}, count:{$sum:"$doc-amount"}}
            }
          ]).sort({"_id": 1}).toArray()
          return res.json(receipts);
          
        }         

        default:
          return res.json({ error: "Method not supported" });
      }
    
  } catch (error) {
    console.log(error)
  }
  
}
export default handler  