import { connectToDatabase } from  "../../../../lib/mongoconnect";

const handler =  async (req, res) => {
  // handle different methods
  try {
    switch (req.method) {
        case "GET": {
          const { db } = await connectToDatabase();
          const issues = await db.collection("materialdocuments").aggregate([
            {
               $match:
               {
                'doc-amount':{
                  $lte:0.00
                }
               }
            },
            {
              $group: {_id:{$year:"$doc-date"}, count:{$sum:"$doc-amount"}}
            }
          ]).sort({"_id": 1}).toArray()
          return res.json(issues);
          
        }         

        default:
          return res.json({ error: "Method not supported" });
      }
    
  } catch (error) {
    console.log(error)
  }
  
}
export default handler  