import { connectToDatabase } from "../../../../lib/mongoconnect";
import {
  poDateExistsMatch,
  poYearAddFields,
} from "../../../../lib/purchaseReportDateStages";

/**
 * GET /api/reports/services-purchases/years
 * Returns distinct years that have 61-series PO data (for year selector).
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
        { $match: { "po-number": { $regex: /^61/ }, "po-date": { $exists: true, $nin: [null, ""] } } },
        poYearAddFields,
        { $match: { year: { $gte: 2000, $lte: 2100 } } },
        { $group: { _id: "$year" } },
        { $sort: { _id: 1 } },
        { $project: { year: "$_id", _id: 0 } },
      ])
      .toArray();

    return res.json(years.map((r) => r.year).filter(Boolean));
  } catch (error) {
    console.error("services-purchases years API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
