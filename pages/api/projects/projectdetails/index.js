import { connectToDatabase } from "../../../../lib/mongoconnect";

const handler = async (req, res) => {
  // handle different methods
  try {
    switch (req.method) {
      case "GET": {
        const { db } = await connectToDatabase();
        const projectlist = await db
          .collection("projects")
          .find({ "project-wbs": { '$regex': /^ED|IS/, '$options' : 'i' } })
          .toArray();

        return res.json(projectlist);
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};
export default handler;
