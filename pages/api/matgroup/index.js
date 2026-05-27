import { connectToDatabase } from  "../../../lib/mongoconnect";

const handler =  async (req, res) => {
  // handle different methods
  try {
    switch (req.method) {
        case "GET": {
          const { db } = await connectToDatabase();
          const matgrouplist = await db.collection("matgroup").find({}).toArray();
          return res.json(matgrouplist);
          
        } 

        case "POST": {
          const { db } = await connectToDatabase();
          const matgroupNew = await db.collection("matgroup").insertOne(req.body);
          return res.status(200).json({matgroup: matgroupNew, message: "Successfully inserted new matgroup"});
          
        }

        default:
          return res.json({ error: "Method not supported" });
      }
    
  } catch (error) {
    console.log(error)
  }
  
}
export default handler  