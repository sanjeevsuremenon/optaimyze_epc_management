import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { db } = await connectToDatabase();
  // handle different methods
  try {
    switch (req.method) {
      case "GET": {
        const servicetypeslist = await db.collection("servicegroups").find({}).toArray();
        return res.json(servicetypeslist);
      }

      case "POST": {
        const servicetype = await db.collection("servicegroups").insert({
          servicegroup: req.body.servicegroup,
          servicecategory:req.body.servicecategory,
          servicesubcategory: req.body.servicesubcategory,
                   
        });
        return res.json(servicetype);
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};
export default handler;
