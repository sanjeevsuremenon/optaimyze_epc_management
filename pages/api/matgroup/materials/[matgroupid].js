import { connectToDatabase } from  "../../../../lib/mongoconnect";

const handler =  async (req, res) => {

    const { matgroupid } = req.query;
  // handle different methods
  try {
    switch (req.method) {
        case "GET": {
          const { db } = await connectToDatabase();
          const matlist = await db.collection("materials").find({
            "material-group": matgroupid
          }).toArray();
          return res.json(matlist);
          
        } 

      default:
          return res.json({ error: "Method not supported" });
      }
    
  } catch (error) {
    console.log(error)
  }
  
}
export default handler  