import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "../../../lib/mongoconnect";

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const collection = db.collection("lessons_learnt");

  if (req.method === "GET") {
    // List pages summary for sidebar
    const pages = await collection
      .find({}, { projection: { _id: 1, slug: 1, title: 1, updatedAt: 1 } })
      .sort({ updatedAt: -1 })
      .toArray();
    return res.status(200).json({ pages });
  }

  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const { title, slug, content } = req.body || {};
    if (!title || !slug) return res.status(400).json({ error: "title and slug required" });

    const now = new Date();

    const existing = await collection.findOne({ slug });
    if (existing) return res.status(409).json({ error: "Slug already exists" });

    const page = {
      title,
      slug,
      content: content || "",
      contributors: session?.user?.email ? [session.user.email] : [],
      createdBy: session?.user?.email || null,
      createdAt: now,
      updatedAt: now,
    };

    const { insertedId } = await collection.insertOne(page);
    return res.status(201).json({ id: insertedId, ...page });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end("Method Not Allowed");
}


