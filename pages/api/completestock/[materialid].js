import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { materialid } = req.query;
  const { db } = await connectToDatabase();

  try {
    switch (req.method) {
      case "GET": {
        try {
          const material = await db
            .collection("completestock")
            .findOne({ "material-code": materialid });
            if(material){
              return res.json(material)
              }
            return res.json({})
            
        } catch (error) {
          console.error(err);
          
        }

        
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};

export default handler;
