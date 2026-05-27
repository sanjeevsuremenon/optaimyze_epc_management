import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { db } = await connectToDatabase();
  // handle different methods
  try {
    switch (req.method) {
      case "GET": {
        const mattypeslist = await db.collection("mattypes").find({}).toArray();
        return res.json(mattypeslist);
      }

      case "POST": {
        const mattype = await db.collection("mattypes").insert({
          materialcode: req.body.materialcode,
          materialtype:req.body.materialtype,
          mattypedescription: req.body.mattypedescription,
          matgroupprimary: req.body.matgroupprimary,
          matgroupprimarydesc: req.body.matgroupprimarydesc,
          datgroupsecondarydesc: req.body.datgroupsecondarydesc,          
        });
        return res.json(mattype);
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};
export default handler;
