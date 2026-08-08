import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { projectid } = req.query;
  const { db } = await connectToDatabase();

  try {
    switch (req.method) {
      case "GET": {
        if (!projectid) {
          return res.status(200).json(null);
        }

        let decoded = String(projectid);
        try {
          decoded = decodeURIComponent(decoded);
        } catch {
          // keep raw value
        }

        const project =
          (await db.collection("projects").findOne({ "project-wbs": decoded })) ||
          (decoded !== projectid
            ? await db.collection("projects").findOne({ "project-wbs": String(projectid) })
            : null);

        // Always 200 — callers show an empty state instead of treating missing projects as 404
        return res.status(200).json(project || null);
      }

      default:
        return res.status(405).json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default handler;
