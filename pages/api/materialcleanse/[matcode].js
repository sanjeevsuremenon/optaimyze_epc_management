import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { matcode } = req.query;
  const { db } = await connectToDatabase();
  console.log(matcode)

  try {
    switch (req.method) {
      case "GET": {
        const material = await db
          .collection("materialcleanse")
          .findOne({ "materialcode": matcode }) || {}

        return res.json(material);
      }
      

      //   case "POST": {
      //     const material = await db.collection("materialcleanse").insertOne({
      //         matcode: matcode
      //     })
      //   }

      case "PUT": {
        const material = await db.collection("materialcleanse").updateOne(
          { materialcode: matcode },
          {
            $set: {
              matgroupold: req.body.matgroupold,
              matgroupnew: req.body.matgroupnew,              
              mattypeold: req.body.mattypeold,
              mattypenew: req.body.mattypenew,
              matdescriptionold: req.body.matdescriptionold,
              matdescriptionnew: req.body.matdescriptionnew,
              matgroupsecnew: req.body.matgroupsecnew,
              longtext: req.body.longtext,
            },
          },
          { upsert: true }
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
