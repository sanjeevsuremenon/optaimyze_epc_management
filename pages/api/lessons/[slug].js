import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "../../../lib/mongoconnect";

export default async function handler(req, res) {
  const {
    query: { slug },
    method,
  } = req;

  const { db } = await connectToDatabase();
  const collection = db.collection("lessons_learnt");

  if (method === "GET") {
    const page = await collection.findOne({ slug });
    if (!page) return res.status(404).json({ error: "Not found" });
    return res.status(200).json(page);
  }

  if (method === "PUT") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const { title, content } = req.body || {};
    const now = new Date();

    const existing = await collection.findOne({ slug });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const updateDoc = {
      ...(title ? { title } : {}),
      ...(typeof content === "string" ? { content } : {}),
      updatedAt: now,
    };

    const contributors = new Set(existing.contributors || []);
    if (session?.user?.email) contributors.add(session.user.email);

    updateDoc.contributors = Array.from(contributors);

    await collection.updateOne({ slug }, { $set: updateDoc });
    const updated = await collection.findOne({ slug });
    return res.status(200).json(updated);
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).end("Method Not Allowed");
}


