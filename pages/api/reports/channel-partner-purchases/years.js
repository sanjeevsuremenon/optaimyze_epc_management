import { connectToDatabase } from "../../../../lib/mongoconnect";

/**
 * GET /api/reports/channel-partner-purchases/years
 * Returns distinct years that have 71-series PO data (for year selector).
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();

    const years = await db
      .collection("purchaseorders")
      .aggregate([
        { $match: { "po-number": { $regex: /^71/ }, "po-date": { $exists: true, $ne: null } } },
        {
          $addFields: {
            year: {
              $cond: {
                if: { $eq: [{ $type: "$po-date" }, "date"] },
                then: { $year: "$po-date" },
                else: {
                  $let: {
                    vars: { s: { $toString: "$po-date" } },
                    in: { $toInt: { $substr: ["$$s", 0, 4] } },
                  },
                },
              },
            },
          },
        },
        { $match: { year: { $gte: 2000, $lte: 2100 } } },
        { $group: { _id: "$year" } },
        { $sort: { _id: 1 } },
        { $project: { year: "$_id", _id: 0 } },
      ])
      .toArray();

    return res.json(years.map((r) => r.year).filter(Boolean));
  } catch (error) {
    console.error("channel-partner-purchases years API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
