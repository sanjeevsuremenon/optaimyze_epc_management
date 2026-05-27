import { connectToDatabase } from "../../../../lib/mongoconnect";

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
 * GET /api/reports/domestic-purchases/monthwise?year=2024
 * Returns same columns as main report but one row per material per month (45-series, year required).
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

    const startOfYear = new Date(yearNum, 0, 1, 0, 0, 0, 0);
    const endOfYear = new Date(yearNum, 11, 31, 23, 59, 59, 999);

    const dateFilterStage = [
      { $match: { "po-date": { $exists: true, $ne: null } } },
      {
        $addFields: {
          poDateNorm: {
            $cond: {
              if: { $eq: [{ $type: "$po-date" }, "date"] },
              then: "$po-date",
              else: { $toDate: "$po-date" },
            },
          },
        },
      },
      { $match: { poDateNorm: { $gte: startOfYear, $lte: endOfYear } } },
      { $addFields: { year: { $year: "$poDateNorm" }, month: { $month: "$poDateNorm" } } },
    ];

    const match45 = { "po-number": { $regex: /^45/ } };

    const pipeline45 = [
      { $match: { ...match45, "po-date": { $exists: true, $ne: null } } },
      ...dateFilterStage,
      materialGroupStage,
      {
        $group: {
          _id: { materialGroup: "$materialGroup", year: "$year", month: "$month" },
          poNumbers: { $addToSet: "$po-number" },
          totalValue: { $sum: { $ifNull: ["$po-value-sar", 0] } },
          totalQtyCash: qtySum,
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
          totalQtyCash: 1,
          materialCode: 1,
          materialDescription: 1,
          _id: 0,
        },
      },
      { $sort: { year: 1, month: 1, poCount: -1, totalValue: -1 } },
    ];

    const pipelineAll = [
      ...dateFilterStage,
      materialGroupStage,
      {
        $group: {
          _id: { materialGroup: "$materialGroup", year: "$year", month: "$month" },
          totalQtyAll: qtySum,
        },
      },
      { $project: { materialKey: "$_id.materialGroup", year: "$_id.year", month: "$_id.month", totalQtyAll: 1, _id: 0 } },
    ];

    const [result45, resultAll] = await Promise.all([
      coll.aggregate(pipeline45).toArray(),
      coll.aggregate(pipelineAll).toArray(),
    ]);

    const allQtyByKey = {};
    resultAll.forEach((r) => {
      const k = `${r.materialKey}|${r.year}|${r.month}`;
      allQtyByKey[k] = r.totalQtyAll ?? 0;
    });

    const merged = result45.map((row) => {
      const k = `${row.materialKey}|${row.year}|${row.month}`;
      return {
        ...row,
        monthLabel: `${MONTH_NAMES[(row.month || 1) - 1]} ${row.year || yearNum}`,
        totalQtyAll: allQtyByKey[k] ?? 0,
      };
    });

    return res.json(merged);
  } catch (error) {
    console.error("domestic-purchases monthwise API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
