import { connectToDatabase } from "../../../../lib/mongoconnect";

const handler = async (req, res) => {
  // handle different methods
  try {
    switch (req.method) {
      case "GET": {
        const { db } = await connectToDatabase();
       
        const vendorpolist = await db.collection("vendorsandtheirpo").aggregate(
          
          [{
            "$match":{
            "$and":[
            {"vendorpo": {$not:{$size:0}}},
            
            ]
          }
          },
         

          {
            "$project":{"vendor-code": 1, "vendor-name": 1}
          }
          ]
        ).toArray()

        // const vendorpolist = await db.collection("vendorsandtheirpo").aggregate(
        //   [
        //   { $limit : 10000 }
        //   ]
          
        // ).toArray()

        return res.json(vendorpolist)
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};
export default handler;
