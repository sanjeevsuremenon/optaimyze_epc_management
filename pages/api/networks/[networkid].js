import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { networkid } = req.query;
  const { db } = await connectToDatabase();

  try {
    switch (req.method) {
      case "GET": {
        const network = await db
          .collection("networks")
          .findOne({ "project-wbs": networkid});

        return res.json(network);
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};

export default handler;