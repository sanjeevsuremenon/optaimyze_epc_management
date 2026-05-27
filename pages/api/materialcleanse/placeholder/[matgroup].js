import { connectToDatabase } from "../../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { matgroup } = req.query;
  const { db } = await connectToDatabase();
  // console.log(matcode)

  try {
    switch (req.method) {
      case "GET": {
        const placeholder = await db
          .collection("materialcleanseplaceholders")
          .findOne({ "matgroup": matgroup }) || {primary:"Primary desc", secondary:"Secondary desc", tertiary:"Tertiary desc"}

        return res.json(placeholder);
      }

     
      case "POST": {
        const placeholer = await db.collection("materialcleanseplaceholders").insert(
         {matgroup:matgroup,
            primary:req.body.primary,
            secondary:req.body.secondary,
            tertiary:req.body.tertiary,
         }
        );

        return res.json(placeholer);
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};

export default handler;
