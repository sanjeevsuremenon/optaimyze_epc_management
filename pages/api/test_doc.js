import { connectToDatabase } from "../../lib/mongoconnect";

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  const doc = await db.collection("materialdocumentsforpo").findOne({});
  res.json(doc);
}
