import { connectToDatabase } from  "../../../../lib/mongoconnect";

const handler =  async (req, res) => {
  // handle different methods
  try {
    switch (req.method) {
        case "GET": {
          const { db } = await connectToDatabase();
          const allchatlist = await db.collection("matcoderequestchats").find({}).toArray();
          return res.json(allchatlist);
          
        } 

        case "POST": {
          const {db} = await connectToDatabase();
          const newmatcodechat = await db.collection("matcoderequestchats").insertOne(
            {
              query: req.body.query,
              created_by: req.body.user,
              created_at: new Date(),
              
            }
          )
            
          
          return  res.status(201).json({ message: 'chat inserted successfully' });
        }
       
        default:
          return res.json({ error: "Method not supported" });
      }
    
  } catch (error) {
    console.log(error)
  }
  
}
export default handler  