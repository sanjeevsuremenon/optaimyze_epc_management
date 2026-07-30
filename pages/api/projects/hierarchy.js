import { connectToDatabase } from "../../../lib/mongoconnect";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { projectWbs } = req.query;
  if (!projectWbs) {
    return res.status(400).json({ error: "Project WBS parameter is required" });
  }

  try {
    const { db } = await connectToDatabase();

    // 1. Get Project Details
    const project = await db.collection("projects").findOne({ "project-wbs": projectWbs });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // 2. Get Associated Networks
    const networks = await db.collection("networks")
      .find({ "project-wbs": projectWbs })
      .toArray();

    // 3. Get Associated WBS Elements (prefix match, e.g., "IS/GP.21.038" matches "IS/GP.21.038.01")
    // Escape regex special chars
    const escapedWbs = projectWbs.replace(/[.*+?^${}()[\]\\]/g, '\\$&');
    const wbsElements = await db.collection("wbsdescriptions")
      .find({ "wbs-number": { $regex: `^${escapedWbs}` } })
      .toArray();

    return res.status(200).json({
      project,
      networks,
      wbsElements
    });
  } catch (error) {
    console.error("Error fetching project hierarchy:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
