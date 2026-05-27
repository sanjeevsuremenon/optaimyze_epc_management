import { connectToDatabase } from "../../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { vendornumber } = req.query;
  const { vendorcode } = req.query;
  console.log('API called with vendorcode:', vendorcode);
  const { db } = await connectToDatabase();
  // console.log(matcode)

  try {
    switch (req.method) {
      case "GET": {
        const vendoreval =
          (await db
            .collection("vendorevaluation")
            .findOne({ vendorcode: vendornumber })) || [];

        return res.json(vendoreval);
      }

      case "PUT": {
        const vendoreval = await db.collection("vendorevaluation").updateOne(
          { vendorcode: vendornumber },
          {
            $set: {
              fixedevalyear2024: req.body,
            },
          },
          { upsert: true }
        );

        return res.json(vendoreval);
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};

export default handler;
