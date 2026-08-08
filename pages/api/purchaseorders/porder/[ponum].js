import { connectToDatabase } from "../../../../lib/mongoconnect";

function buildPoNumberFilter(ponum) {
  const raw = Array.isArray(ponum) ? ponum[0] : ponum;
  let s = String(raw ?? "").trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    // keep raw string
  }
  s = s.trim();
  if (!s || s === "undefined" || s === "null") return null;

  const variants = [s];
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (Number.isSafeInteger(n)) variants.push(n);
  }

  return { "po-number": { $in: variants } };
}

const handler = async (req, res) => {
  const { ponum } = req.query;

  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not supported" });
    }

    const filter = buildPoNumberFilter(ponum);
    if (!filter) {
      return res.status(400).json({ error: "Invalid PO number", data: [] });
    }

    const { db } = await connectToDatabase();
    const polist = await db
      .collection("purchaseorders")
      .find(filter)
      .sort({ "po-line-item": 1 })
      .toArray();

    return res.status(200).json(polist);
  } catch (error) {
    console.error("API /purchaseorders/porder/[ponum] error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default handler;
