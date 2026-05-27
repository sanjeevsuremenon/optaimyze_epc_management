import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { ponumber } = req.query;
  const { db } = await connectToDatabase();

  try {
    switch (req.method) {
      case "GET": {
        if (!ponumber) {
          return res.status(400).json({ error: "PO number is required" });
        }

        const deliveryHistory = await db
          .collection("materialdocumentsforpo")
          .find({ ponumber: ponumber })
          .sort({ documentdate: -1, polineitem: 1, documentlineitem: 1 })
          .toArray();

        return res.json(deliveryHistory);
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default handler;
