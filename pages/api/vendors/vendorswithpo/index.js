import { connectToDatabase } from "../../../../lib/mongoconnect";

/**
 * GET: All vendors who have had purchase orders issued
 * (any year up to end of today). Eligible for evaluation.
 */
const handler = async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not supported" });
    }

    const { db } = await connectToDatabase();

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Distinct vendors from purchaseorders with PO date <= today (or missing date)
    const fromPOs = await db
      .collection("purchaseorders")
      .aggregate([
        {
          $match: {
            vendorcode: { $exists: true, $nin: [null, ""] },
            $or: [
              { "po-date": { $lte: endOfToday } },
              { "po-date": { $exists: false } },
              { "po-date": null },
            ],
          },
        },
        {
          $group: {
            _id: "$vendorcode",
            "vendor-code": { $first: "$vendorcode" },
            "vendor-name": { $first: "$vendorname" },
            poCount: { $sum: 1 },
            lastPoDate: { $max: "$po-date" },
          },
        },
        { $sort: { "vendor-name": 1, "vendor-code": 1 } },
      ])
      .toArray();

    // Fallback / supplement from vendorsandtheirpo (legacy pre-aggregated collection)
    const fromLegacy = await db
      .collection("vendorsandtheirpo")
      .aggregate([
        {
          $match: {
            "vendor-code": { $exists: true, $nin: [null, ""] },
            vendorpo: { $exists: true, $ne: [] },
          },
        },
        { $unwind: { path: "$vendorpo", preserveNullAndEmptyArrays: false } },
        {
          $match: {
            $or: [
              { "vendorpo.po-date": { $lte: endOfToday } },
              { "vendorpo.po-date": { $exists: false } },
              { "vendorpo.po-date": null },
            ],
          },
        },
        {
          $group: {
            _id: "$vendor-code",
            "vendor-code": { $first: "$vendor-code" },
            "vendor-name": { $first: "$vendor-name" },
            poCount: { $sum: 1 },
            lastPoDate: { $max: "$vendorpo.po-date" },
          },
        },
      ])
      .toArray();

    const byCode = new Map();
    const upsert = (v) => {
      const code = String(v["vendor-code"] || v._id || "").trim();
      if (!code) return;
      const existing = byCode.get(code);
      if (!existing) {
        byCode.set(code, {
          "vendor-code": code,
          "vendor-name": v["vendor-name"] || "",
          poCount: v.poCount || 0,
          lastPoDate: v.lastPoDate || null,
        });
        return;
      }
      existing.poCount = Math.max(existing.poCount || 0, v.poCount || 0);
      if (!existing["vendor-name"] && v["vendor-name"]) {
        existing["vendor-name"] = v["vendor-name"];
      }
      const a = existing.lastPoDate ? new Date(existing.lastPoDate).getTime() : 0;
      const b = v.lastPoDate ? new Date(v.lastPoDate).getTime() : 0;
      if (b > a) existing.lastPoDate = v.lastPoDate;
    };

    fromPOs.forEach(upsert);
    fromLegacy.forEach(upsert);

    // Enrich names from vendors master when missing
    const codes = [...byCode.keys()];
    if (codes.length > 0) {
      const masters = await db
        .collection("vendors")
        .find(
          { "vendor-code": { $in: codes } },
          { projection: { "vendor-code": 1, "vendor-name": 1 } }
        )
        .toArray();
      masters.forEach((m) => {
        const row = byCode.get(String(m["vendor-code"]));
        if (row && m["vendor-name"]) {
          row["vendor-name"] = m["vendor-name"];
        }
      });
    }

    // Group mapping flag (by vendor name — legacy) and by vendorCode
    const [mappedNames, mappedCodes, evalCodes] = await Promise.all([
      db.collection("vendormapgroup").distinct("vendorname"),
      db.collection("vendorgroupmap").distinct("vendorCode"),
      db.collection("vendorevaluationmarks").distinct("vendorcode"),
    ]);

    const mappedNameSet = new Set(
      (mappedNames || []).map((n) => String(n || "").trim().toLowerCase())
    );
    const mappedCodeSet = new Set(
      (mappedCodes || []).map((c) => String(c || "").trim())
    );
    const evaluatedSet = new Set(
      (evalCodes || []).map((c) => String(c || "").trim())
    );

    const vendors = [...byCode.values()]
      .map((v) => {
        const nameKey = String(v["vendor-name"] || "").trim().toLowerCase();
        const code = String(v["vendor-code"] || "").trim();
        return {
          ...v,
          mapped: mappedCodeSet.has(code) || mappedNameSet.has(nameKey),
          evaluated: evaluatedSet.has(code),
        };
      })
      .sort((a, b) =>
        String(a["vendor-name"] || "").localeCompare(String(b["vendor-name"] || ""))
      );

    return res.status(200).json({
      vendors,
      total: vendors.length,
    });
  } catch (error) {
    console.error("API /vendors/vendorswithpo error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default handler;
