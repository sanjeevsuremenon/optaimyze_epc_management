import { connectToDatabase } from "../../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { vendorcode } = req.query;
  
  console.log('API called with vendorcode:', vendorcode);
  // handle different methods
  try {
    switch (req.method) {
      case "GET": {
        const { db } = await connectToDatabase();
        const vendoreval = await db
          .collection("vendorevaluationmarks")
          .findOne({ vendorcode: vendorcode });
        if (vendoreval) {
          return res.json(vendoreval);
        }
        return res.json({});
      }
       

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};
export default handler;
