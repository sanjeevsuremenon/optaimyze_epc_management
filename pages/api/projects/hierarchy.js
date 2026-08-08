import { connectToDatabase } from "../../../lib/mongoconnect";

function normalizeActivities(raw) {
  if (!raw) return [];
  const toItem = (activityNumber, activityWbs) => {
    const num = String(activityNumber || "").trim();
    const wbs = String(activityWbs || "").trim();
    if (!num && !wbs) return null;
    return { "activity-number": num, "activity-wbs": wbs };
  };

  let items = [];
  if (Array.isArray(raw)) {
    raw.forEach((entry) => {
      if (entry && typeof entry === "object") {
        const item = toItem(
          entry["activity-number"] ?? entry.activityNumber,
          entry["activity-wbs"] ?? entry.activityWbs
        );
        if (item) items.push(item);
      } else if (typeof entry === "string") {
        const [a, b] = entry.split(":").map((s) => s.trim());
        const item = toItem(a, b || "");
        if (item) items.push(item);
      }
    });
  } else if (typeof raw === "string") {
    raw
      .split(/[;\n|]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((part) => {
        const [a, b] = part.split(":").map((s) => s.trim());
        const item = toItem(a, b || "");
        if (item) items.push(item);
      });
  }
  return items;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let { projectWbs } = req.query;
  if (!projectWbs) {
    return res.status(400).json({ error: "Project WBS parameter is required" });
  }

  try {
    projectWbs = decodeURIComponent(String(projectWbs));
  } catch {
    projectWbs = String(projectWbs);
  }

  try {
    const { db } = await connectToDatabase();

    const project = await db.collection("projects").findOne({ "project-wbs": projectWbs });
    if (!project) {
      return res.status(200).json({
        project: null,
        networks: [],
        wbsElements: [],
      });
    }

    const networksRaw = await db
      .collection("networks")
      .find({ "project-wbs": projectWbs })
      .toArray();

    const networks = networksRaw.map((net) => {
      const activities = normalizeActivities(
        net.activities ?? net["activity-numbers"] ?? net["activity-number"]
      );
      return {
        ...net,
        activities,
        "activity-numbers": activities.map((a) => a["activity-number"]).filter(Boolean),
        "activity-number": activities
          .map((a) => a["activity-number"])
          .filter(Boolean)
          .join("; "),
      };
    });

    const escapedWbs = projectWbs.replace(/[.*+?^${}()[\]\\]/g, "\\$&");
    const wbsElements = await db
      .collection("wbsdescriptions")
      .find({ "wbs-number": { $regex: `^${escapedWbs}` } })
      .sort({ "wbs-number": 1 })
      .toArray();

    return res.status(200).json({
      project,
      networks,
      wbsElements,
    });
  } catch (error) {
    console.error("Error fetching project hierarchy:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
