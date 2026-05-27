import { connectToDatabase } from "../../../../lib/mongoconnect";

/** Helper: sum po-quantity (handles number or Decimal128) */
const qtySum = { $sum: { $convert: { input: "$po-quantity", to: "double", onError: 0, onNull: 0 } } };

/** Shared materialGroup addFields stage */
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

/**
 * GET /api/reports/cash-po-materials?year=2024  (or ?year=all for entire collection)
 * Returns 47-series PO materials: for each material (by code or description),
 * number of distinct POs, total value, total qty (47* only), total qty (all PO types).
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { year } = req.query;
    const allYears = year === "all" || year === "all-years";
    const yearNum = !allYears && year ? parseInt(year, 10) : null;

    if (!allYears && (!yearNum || isNaN(yearNum) || yearNum < 2000 || yearNum > 2100)) {
      return res.status(400).json({
        error: "Valid year query parameter required (e.g. ?year=2024 or ?year=all)",
      });
    }

    const { db } = await connectToDatabase();
    const coll = db.collection("purchaseorders");

    const startOfYear = !allYears ? new Date(yearNum, 0, 1, 0, 0, 0, 0) : null;
    const endOfYear = !allYears ? new Date(yearNum, 11, 31, 23, 59, 59, 999) : null;

    const dateFilterStage = !allYears
      ? [
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
        ]
      : [];

    // 1) 47* (cash PO) pipeline: poCount, totalValue, totalQtyCash
    const match47 = { "po-number": { $regex: /^47/ } };
    const pipeline47 = [
      { $match: allYears ? match47 : { ...match47, "po-date": { $exists: true, $ne: null } } },
      ...dateFilterStage,
      materialGroupStage,
      {
        $group: {
          _id: "$materialGroup",
          poNumbers: { $addToSet: "$po-number" },
          totalValue: { $sum: { $ifNull: ["$po-value-sar", 0] } },
          totalQtyCash: qtySum,
          materialCode: { $first: "$material.matcode" },
          materialDescription: { $first: "$material.matdescription" },
        },
      },
      {
        $project: {
          materialKey: "$_id",
          poCount: { $size: "$poNumbers" },
          totalValue: 1,
          totalQtyCash: 1,
          materialCode: 1,
          materialDescription: 1,
          _id: 0,
        },
      },
      { $sort: { poCount: -1, totalValue: -1 } },
    ];

    // 2) All PO types pipeline: totalQtyAll per material (same year filter as 47*)
    const pipelineAll = [
      ...dateFilterStage,
      materialGroupStage,
      { $group: { _id: "$materialGroup", totalQtyAll: qtySum } },
      { $project: { materialKey: "$_id", totalQtyAll: 1, _id: 0 } },
    ];

    const [result47, resultAll] = await Promise.all([
      coll.aggregate(pipeline47).toArray(),
      coll.aggregate(pipelineAll).toArray(),
    ]);

    const allQtyByKey = {};
    resultAll.forEach((r) => {
      allQtyByKey[r.materialKey] = r.totalQtyAll ?? 0;
    });

    const merged = result47.map((row) => ({
      ...row,
      totalQtyAll: allQtyByKey[row.materialKey] ?? 0,
    }));

    return res.json(merged);
  } catch (error) {
    console.error("cash-po-materials API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
