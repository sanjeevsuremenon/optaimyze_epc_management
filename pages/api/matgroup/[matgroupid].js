import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { matgroupid } = req.query;
  const { db } = await connectToDatabase();

  try {
    switch (req.method) {
      case "GET": {       
        
        const matgroup = await db
          .collection("matgroup")
          .findOne({ "material-group": matgroupid }) || {}
          
        return res.json(matgroup);
      }     

      case "PUT": {       
        
        const matgroup = await db
          .collection("matgroup")
          .updateOne({ "material-group": matgroupid },{ $set:{
            "updated-date": req.body["updated-date"],
            "updated-by": req.body["updated-by"],
            "changed-primary-desc": req.body["changed-primary-desc"],
            "changed-secondary-desc": req.body["changed-secondary-desc"],
                      }});
          
        return res.status(200).json({message:"MATGROUP UPDATED"});
      }   
      
      case "DELETE": {       
        
        const matgroup = await db
          .collection("matgroup")
          .deleteOne({ "material-group": matgroupid });
          
        return res.status(200).json({ message: "Successfully deleted the matgroup"});
      }     

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};

export default handler;
