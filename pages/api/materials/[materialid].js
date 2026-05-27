import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { materialid } = req.query;
  const { db } = await connectToDatabase();

  try {
    switch (req.method) {
      case "GET": {       
        
        const material = await db
          .collection("materials")
          .findOne({ "material-code": materialid });
          
        return res.json(material);
      }     

      case "PUT": {       
        
        const material = await db
          .collection("materials")
          .updateOne({ "material-code": materialid },{ $set:{
            "updated-date": req.body["updated-date"],
            "updated-by": req.body["updated-by"],
            "material-group": req.body["material-group"],
            "material-description": req.body["material-description"],
                      }});
          
        return res.status(200).json({message:"MATERIAL UPDATED"});
      }   
      
      case "DELETE": {       
        
        const material= await db
          .collection("materials")
          .deleteOne({ "material-code": materialcode });
          
        return res.status(200).json({ message: "Successfully deleted the material"});
      }     

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};

export default handler;
