import { connectToDatabase } from  "../../../../../lib/mongoconnect";

const handler =  async (req, res) => {
  const { ponumber } = req.query;
  const { db } = await connectToDatabase();
  // handle different methods 
  try {
    switch (req.method) {
        case "GET": {
          const { db } = await connectToDatabase();
          const pocomments = await db.collection("pocomments").find({ponumber: ponumber}).toArray();
          return res.json(pocomments);
          
        } 

        case "POST": {
          const {title, comment, user} = req.body
   
          if (!title || !comment) {
           return res.status(400).send("data is missing or invalid.");
         }
   
         const vendorcomment = await db
             .collection("pocomments")
             .insertOne({ ponumber: ponumber, title: title, comment: comment, updatedBy: user, updatedAt: new Date() });
   
           // console.log(user)
           return res.status(200).json({ message: "success!" });
         }
      
        default:
          return res.json({ error: "Method not supported" });
      }
    
  } catch (error) {
    console.log(error)
  }  
}
export default handler  