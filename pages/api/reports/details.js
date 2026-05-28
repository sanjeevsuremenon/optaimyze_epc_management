import { connectToDatabase } from "../../../lib/mongoconnect";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { type, materialKey, year } = req.query;

    if (!materialKey) {
      return res.status(400).json({ error: "materialKey is required" });
    }

    const allYears = year === "all" || year === "all-years";
    const yearNum = !allYears && year ? parseInt(year, 10) : null;

    const { db } = await connectToDatabase();
    const coll = db.collection("purchaseorders");

    // 1. Determine prefix matching based on type
    let poRegex;
    switch (type) {
      case "domestic":
        poRegex = /^45/;
        break;
      case "import":
        poRegex = /^46/;
        break;
      case "cash":
        poRegex = /^47/;
        break;
      case "channel":
        poRegex = /^71/;
        break;
      case "services":
        poRegex = /^61/;
        break;
      case "all":
      default:
        poRegex = /.*/;
        break;
    }

    // 2. Date boundaries
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

    // 3. Match Material Key
    // Material Key is matched if matcode == materialKey OR (matcode missing/empty AND matdescription == materialKey)
    const materialMatchStage = {
      $match: {
        $or: [
          { "material.matcode": materialKey },
          {
            $and: [
              { $or: [{ "material.matcode": null }, { "material.matcode": "" }, { "material.matcode": { $exists: false } }] },
              { "material.matdescription": materialKey }
            ]
          }
        ]
      }
    };

    const pipeline = [
      { $match: { "po-number": { $regex: poRegex } } },
      ...dateFilterStage,
      materialMatchStage,
      {
        $project: {
          _id: 1,
          poNumber: "$po-number",
          poDate: "$po-date",
          vendorCode: "$vendor.code",
          vendorName: "$vendor.name",
          unitRate: "$po-rate",
          qty: "$po-quantity",
          valueSar: "$po-value-sar",
          materialCode: "$material.matcode",
          materialDescription: "$material.matdescription",
        }
      },
      { $sort: { poDate: -1, poNumber: -1 } }
    ];

    const result = await coll.aggregate(pipeline).toArray();
    return res.json(result);
  } catch (error) {
    console.error("Purchases details API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
