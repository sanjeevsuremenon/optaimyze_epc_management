import { connectToDatabase } from "../../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { user } = req.query;
  const { db } = await connectToDatabase();
  // console.log(matcode)

  try {
    switch (req.method) {
      case "GET": {
        const matcodereqchat = await db
          .collection("matcoderequestchats")
          .find({ "created_by": user }).toArray() || [{}]

        return res.json(matcodereqchat);
      }

            
      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};

export default handler;
