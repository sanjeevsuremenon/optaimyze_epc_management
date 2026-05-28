import { connectToDatabase } from "../../../../../lib/mongoconnect";
import { ObjectId } from "mongodb";

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
   
           return res.status(200).json({ message: "success!" });
         }

        case "PUT": {
          const { id, title, comment, user } = req.body;
          if (!id || !title || !comment) {
            return res.status(400).send("data is missing or invalid.");
          }

          // Verify ownership before update (optional extra security, but frontend will handle UI hiding)
          const existing = await db.collection("pocomments").findOne({ _id: new ObjectId(id) });
          if (!existing || existing.updatedBy !== user) {
             return res.status(403).json({ error: "Unauthorized to edit this comment" });
          }

          await db.collection("pocomments").updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, comment, updatedAt: new Date() } }
          );

          return res.status(200).json({ message: "updated!" });
        }

        case "DELETE": {
          const { commentId, user } = req.query;
          if (!commentId || !user) {
             return res.status(400).send("data is missing or invalid.");
          }

          const existing = await db.collection("pocomments").findOne({ _id: new ObjectId(commentId) });
          if (!existing || existing.updatedBy !== user) {
             return res.status(403).json({ error: "Unauthorized to delete this comment" });
          }

          await db.collection("pocomments").deleteOne({ _id: new ObjectId(commentId) });
          return res.status(200).json({ message: "deleted!" });
        }
      
        default:
          return res.json({ error: "Method not supported" });
      }
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }  
}
export default handler  