import { connectToDatabase } from "../../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { matcode } = req.query;
  const { db } = await connectToDatabase();
  // console.log(matcode)

  try {
    switch (req.method) {
      case "GET": {
        const material = await db
          .collection("materialcleansecomments")
          .find({ "materialcode": matcode }).toArray() || [{}]

        return res.json(material);
      }      

      case "POST": {
        const material = await db.collection("materialcleansecomments").insert({
              materialcode:matcode,
              matgroupold: req.body.matgroupold,
              matgroupnew: req.body.matgroupnew,
              mattypeold: req.body.mattypeold,
              mattypenew: req.body.mattypenew,
              matdescriptionold: req.body.matdescriptionold,
              matdescriptionnew: req.body.matdescriptionnew,
              matgroupsecondarynew: req.body.matgroupsecnew,
              longtext: req.body.longtext,
              username: req.body.username,
            },
          
          
        );

        return res.json(material);
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};

export default handler;
