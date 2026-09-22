import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "../../../lib/mongoconnect";

// Aggregated read-only counts for the authenticated home dashboard.
// Every query below is a countDocuments()/aggregation $count — no writes.

async function safeCount(db, collection) {
  try {
    return await db.collection(collection).countDocuments();
  } catch (e) {
    return null;
  }
}

async function countOpenPOs(db, total) {
  try {
    // 'pending-val-sar' can be a number or an empty string in legacy data,
    // so coerce with $toDouble before comparing.
    const result = await db
      .collection("purchaseorders")
      .aggregate([
        {
          $addFields: {
            pv: { $convert: { input: { $ifNull: ["$pending-val-sar", 0] }, to: "double", onError: 0, onNull: 0 } },
            pq: { $convert: { input: { $ifNull: ["$pending-qty", 0] }, to: "double", onError: 0, onNull: 0 } },
          },
        },
        { $match: { $or: [{ pv: { $gt: 0 } }, { pq: { $gt: 0 } }] } },
        { $count: "n" },
      ])
      .toArray();
    return result.length ? result[0].n : 0;
  } catch (e) {
    return total; // graceful fallback: total POs
  }
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const MODULE_KEYS = new Set([
  "projects", "materials", "stock", "purchaseorders", "vendors",
  "projectdocumentss", "assets", "globalmasters", "tracking", "reports",
  "networks", "wbs", "materialgroups", "mattypes",
]);

const fmtSAR = (n) =>
  "SAR " +
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

async function moduleStats(db, moduleKey) {
  const count = (c) => safeCount(db, c);
  switch (moduleKey) {
    case "projects": {
      const [projects, networks] = await Promise.all([count("projects"), count("networks")]);
      const out = [];
      if (typeof projects === "number") out.push(plural(projects, "project"));
      if (typeof networks === "number") out.push(plural(networks, "network"));
      return out;
    }
    case "materials": {
      const [materials, groups] = await Promise.all([count("materials"), count("materialgroups")]);
      const out = [];
      if (typeof materials === "number") out.push(plural(materials, "material"));
      if (typeof groups === "number") out.push(plural(groups, "material group"));
      return out;
    }
    case "stock": {
      const [complete, special] = await Promise.all([count("completestock"), count("specialstock")]);
      const out = [];
      if (typeof complete === "number") out.push(`${plural(complete, "line")} complete stock`);
      if (typeof special === "number") out.push(`${plural(special, "line")} special stock`);
      return out;
    }
    case "purchaseorders": {
      const total = await count("purchaseorders");
      const open = await countOpenPOs(db, total);
      const out = [];
      if (typeof open === "number" && typeof total === "number")
        out.push(`${open} open · ${plural(total, "PO")} total`);
      try {
        const r = await db
          .collection("purchaseorders")
          .aggregate([
            {
              $group: {
                _id: null,
                v: {
                  $sum: { $convert: { input: "$po-value-sar", to: "double", onError: 0, onNull: 0 } },
                },
              },
            },
          ])
          .toArray();
        if (r.length && r[0].v > 0) out.push(`${fmtSAR(r[0].v)} total order value`);
      } catch (e) {}
      return out;
    }
    case "vendors": {
      const [vendors, evaluations] = await Promise.all([
        count("vendors"),
        count("vendorevaluations"),
      ]);
      const out = [];
      if (typeof vendors === "number") out.push(plural(vendors, "vendor"));
      if (typeof evaluations === "number" && evaluations > 0)
        out.push(`${evaluations} evaluated`);
      return out;
    }
    case "projectdocumentss": {
      const [docs, comments] = await Promise.all([
        count("project_documents_files"),
        count("pocomments"),
      ]);
      const out = [];
      if (typeof docs === "number") out.push(plural(docs, "document"));
      if (typeof comments === "number" && comments > 0) out.push(`${comments} tracked action`);
      return out;
    }
    case "assets": {
      const cities = await count("asset_locationcities");
      const out = [];
      if (typeof cities === "number") out.push(plural(cities, "location city"));
      return out;
    }
    case "globalmasters": {
      const [g, s, c, n] = await Promise.all([
        count("materialgroups"),
        count("materialsubgroups"),
        count("asset_locationcities"),
        count("nonsapvendors"),
      ]);
      const nums = [g, s, c, n].filter((x) => typeof x === "number");
      if (!nums.length) return [];
      return [`${nums.reduce((a, b) => a + b, 0)} master records`, plural(nums.length, "master set")];
    }
    case "tracking":
      return [];
    case "reports": {
      const lessons = await count("lessons_learnt");
      const out = [];
      if (typeof lessons === "number" && lessons > 0) out.push(`${lessons} lessons learnt`);
      return out;
    }
    case "networks": {
      const networks = await count("networks");
      return typeof networks === "number" ? [plural(networks, "network")] : [];
    }
    case "wbs": {
      const wbs = await count("wbsdescriptions");
      return typeof wbs === "number" ? [plural(wbs, "WBS element")] : [];
    }
    case "materialgroups": {
      const groups = await count("materialgroups");
      return typeof groups === "number" ? [plural(groups, "material group")] : [];
    }
    case "mattypes":
      return [];
    default:
      return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { db } = await connectToDatabase();
    const { module: moduleKey } = req.query;
    res.setHeader("Cache-Control", "no-store");

    // Per-module mode: ?module=<key> returns 1–2 human-readable data chips.
    if (moduleKey) {
      if (!MODULE_KEYS.has(moduleKey)) {
        return res.status(400).json({ error: "Unknown module" });
      }
      const stats = await moduleStats(db, moduleKey);
      return res.status(200).json({ success: true, module: moduleKey, stats });
    }

    const [
      projects,
      materials,
      stockComplete,
      stockSpecial,
      poTotal,
      vendors,
      vendorEvaluations,
      projectDocuments,
      materialGroups,
      lessonsLearnt,
      mgGroups,
      mgSubgroups,
      mgCities,
      mgNonsapVendors,
    ] = await Promise.all([
      safeCount(db, "projects"),
      safeCount(db, "materials"),
      safeCount(db, "completestock"),
      safeCount(db, "specialstock"),
      safeCount(db, "purchaseorders"),
      safeCount(db, "vendors"),
      safeCount(db, "vendorevaluations"),
      safeCount(db, "project_documents_files"),
      safeCount(db, "materialgroups"),
      safeCount(db, "lessons_learnt"),
      safeCount(db, "materialgroups"),
      safeCount(db, "materialsubgroups"),
      safeCount(db, "asset_locationcities"),
      safeCount(db, "nonsapvendors"),
    ]);

    const poOpen = await countOpenPOs(db, poTotal);

    let poValue = null;
    try {
      const r = await db
        .collection("purchaseorders")
        .aggregate([
          {
            $group: {
              _id: null,
              v: { $sum: { $convert: { input: "$po-value-sar", to: "double", onError: 0, onNull: 0 } } },
            },
          },
        ])
        .toArray();
      if (r.length && r[0].v > 0) poValue = r[0].v;
    } catch (e) {}

    const globalMasters = [mgGroups, mgSubgroups, mgCities, mgNonsapVendors]
      .filter((n) => typeof n === "number")
      .reduce((a, b) => a + b, 0);

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      success: true,
      stats: {
        projects,
        materials,
        stockComplete,
        stockSpecial,
        poTotal,
        poOpen,
        poValue,
        vendors,
        vendorEvaluations,
        projectDocuments,
        materialGroups,
        lessonsLearnt,
        globalMasters,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({ error: "Failed to load dashboard stats" });
  }
}
