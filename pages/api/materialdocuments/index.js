import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  // handle different methods
  try {
    switch (req.method) {
      case "GET": {
        const { db } = await connectToDatabase();
        // const nperPage = 100;
        const page = parseInt(req.query.page) || 100
        const limit = parseInt(req.query.limit) || 100
        // console.log(limit);
        const matdoclist = await db
          .collection("materialdocuments")
          .find({})
          .sort({ "doc-date": -1 })
          .limit(limit)
          .skip(page)
          .toArray();
        return res.json(matdoclist);
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};
export default handler;
