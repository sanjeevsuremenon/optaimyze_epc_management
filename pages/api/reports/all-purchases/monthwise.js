import { connectToDatabase } from "../../../../lib/mongoconnect";
import {
  poDateExistsMatch,
  yearDateFilterStages,
} from "../../../../lib/purchaseReportDateStages";

/** Helper: sum po-quantity */
const qtySum = { $sum: { $convert: { input: "$po-quantity", to: "double", onError: 0, onNull: 0 } } };

/** Shared materialGroup addFields */
const materialGroupStage = {
  $addFields: {
    materialGroup: {
      $cond: {
        if: {
          $and: [
            { $ne: [{ $ifNull: ["$material.matcode", ""] }, ""] },
            { $ne: [{ $type: "$material.matcode" }, "missing"] },
          ],
        },
        then: "$material.matcode",
        else: { $ifNull: ["$material.matdescription", "(No description)"] },
      },
    },
  },
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * GET /api/reports/all-purchases/monthwise?year=2024
 * Returns same columns as main report but one row per material per month (all POs, year required).
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { year } = req.query;
    const yearNum = year ? parseInt(year, 10) : null;
    if (!yearNum || isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({
        error: "Valid year query parameter required (e.g. ?year=2024). Month-wise does not support year=all.",
      });
    }

    const { db } = await connectToDatabase();
    const coll = db.collection("purchaseorders");

    const dateFilterStage = [
      ...yearDateFilterStages(yearNum),
      { $addFields: { year: { $year: "$poDateNorm" }, month: { $month: "$poDateNorm" } } },
    ];

    const pipeline = [
      { $match: poDateExistsMatch },
      ...dateFilterStage,
      materialGroupStage,
      {
        $group: {
          _id: { materialGroup: "$materialGroup", year: "$year", month: "$month" },
          poNumbers: { $addToSet: "$po-number" },
          totalValue: { $sum: { $ifNull: ["$po-value-sar", 0] } },
          totalQty: qtySum,
          materialCode: { $first: "$material.matcode" },
          materialDescription: { $first: "$material.matdescription" },
        },
      },
      {
        $project: {
          materialKey: "$_id.materialGroup",
          year: "$_id.year",
          month: "$_id.month",
          poCount: { $size: "$poNumbers" },
          totalValue: 1,
          totalQty: 1,
          materialCode: 1,
          materialDescription: 1,
          _id: 0,
        },
      },
      { $sort: { year: 1, month: 1, poCount: -1, totalValue: -1 } },
    ];

    const result = await coll.aggregate(pipeline).toArray();
    const withMonthLabel = result.map((row) => ({
      ...row,
      monthLabel: `${MONTH_NAMES[(row.month || 1) - 1]} ${row.year || yearNum}`,
    }));
    return res.json(withMonthLabel);
  } catch (error) {
    console.error("all-purchases monthwise API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
