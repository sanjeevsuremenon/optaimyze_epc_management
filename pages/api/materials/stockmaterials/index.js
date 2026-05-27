import { connectToDatabase } from "../../../../lib/mongoconnect";

const handler = async (req, res) => {
  // handle different methods
  try {
    switch (req.method) {
      case "GET": {
        const { db } = await connectToDatabase();
        const totaluniquematerials = await db
          .collection("completestock")
          .distinct("material-code");

        return res.json(totaluniquematerials.length);
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};
export default handler;
