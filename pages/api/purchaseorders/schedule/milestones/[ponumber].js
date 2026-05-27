import { connectToDatabase } from "../../../../../lib/mongoconnect";

const COLLECTION = "po_estimatedvsactual_milestones";

const ACTUAL_KEYS = [
  "baseDesignSubmittal",
  "baseDesignApproval",
  "detailedDesignSubmittal",
  "detailedDesignApproval",
  "manufacturingClearance",
  "itpApproval",
];

function parseActuals(bodyActuals) {
  if (!bodyActuals || typeof bodyActuals !== "object") {
    return ACTUAL_KEYS.reduce((acc, k) => ({ ...acc, [k]: null }), {});
  }
  const out = {};
  for (const key of ACTUAL_KEYS) {
    const v = bodyActuals[key];
    if (v == null || v === "") {
      out[key] = null;
    } else if (typeof v === "string" && !Number.isNaN(Date.parse(v))) {
      out[key] = new Date(v);
    } else {
      out[key] = null;
    }
  }
  return out;
}

export default async function handler(req, res) {
  const { ponumber } = req.query;
  const { method } = req;

  if (!ponumber || ponumber === "undefined") {
    return res.status(400).json({ message: "Invalid PO number" });
  }

  try {
    const { db } = await connectToDatabase();

    switch (method) {
      case "GET": {
        const doc = await db.collection(COLLECTION).findOne({ ponumber });
        if (!doc) {
          return res.status(200).json({
            ponumber,
            actuals: ACTUAL_KEYS.reduce((acc, k) => ({ ...acc, [k]: null }), {}),
            updatedAt: null,
            updatedBy: null,
          });
        }
        const serialized = JSON.parse(JSON.stringify(doc));
        return res.status(200).json(serialized);
      }

      case "POST": {
        const { actuals, user, poIssueDate, povalue } = req.body || {};
        const parsed = parseActuals(actuals);

        const updateDoc = {
          ponumber,
          actuals: parsed,
          updatedAt: new Date(),
          updatedBy: user || "System",
        };

        if (poIssueDate != null && poIssueDate !== "") {
          const d = new Date(poIssueDate);
          if (!Number.isNaN(d.getTime())) {
            updateDoc.poIssueDate = d;
          }
        }
        if (povalue != null && povalue !== "") {
          const n = Number(povalue);
          if (!Number.isNaN(n)) {
            updateDoc.povalue = n;
          }
        }

        await db.collection(COLLECTION).updateOne(
          { ponumber },
          { $set: updateDoc },
          { upsert: true }
        );

        return res.status(200).json({ message: "Milestone actuals saved successfully" });
      }

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error("Error in milestones API:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
