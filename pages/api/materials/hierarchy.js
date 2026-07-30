import { connectToDatabase } from "../../../lib/mongoconnect";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { materialType } = req.query; // E.g., the name of the Material Type (e.g., "Civil Materials")
  if (!materialType) {
    return res.status(400).json({ error: "Material Type parameter is required" });
  }

  try {
    const { db } = await connectToDatabase();

    // 1. Get Material Type (from materialgroups collection)
    const matType = await db.collection("materialgroups").findOne({ "name": materialType });
    if (!matType) {
      return res.status(404).json({ error: "Material type not found" });
    }

    // 2. Get Associated Material Groups (from materialsubgroups collection where groupId === matType._id)
    const groups = await db.collection("materialsubgroups")
      .find({ "groupId": new ObjectId(matType._id) })
      .toArray();

    // 3. Get Associated Materials (from materials collection where material-group is in the group names)
    let materials = [];
    if (groups.length > 0) {
      const groupNames = groups.map(g => g.name);
      materials = await db.collection("materials")
        .find({ "material-group": { $in: groupNames } })
        .limit(100)
        .toArray();
    }

    return res.status(200).json({
      matType,
      groups,
      materials
    });
  } catch (error) {
    console.error("Error fetching material hierarchy:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
