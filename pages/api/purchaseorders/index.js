import { connectToDatabase } from "../../../lib/mongoconnect";

const PAGE_SIZE = 100;

function escapeRegex(string) {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const handler = async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not supported" });
    }

    const { db } = await connectToDatabase();
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || PAGE_SIZE, 1),
      200
    );
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);
    const search = String(req.query.search || "").trim();

    let query = {};
    if (search) {
      const regex = { $regex: escapeRegex(search), $options: "i" };
      query = {
        $or: [
          { "po-number": regex },
          { vendorname: regex },
          { vendorcode: regex },
          { "plant-code": regex },
          { "material.matcode": regex },
          { "material.matdescription": regex },
        ],
      };
    }

    const collection = db.collection("purchaseorders");
    const [total, data] = await Promise.all([
      collection.countDocuments(query),
      collection
        .find(query)
        .sort({ "po-date": -1, "po-number": -1, "po-line-item": 1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    return res.status(200).json({
      data,
      total,
      limit,
      skip,
      hasMore: skip + data.length < total,
    });
  } catch (error) {
    console.error("API /purchaseorders error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default handler;
