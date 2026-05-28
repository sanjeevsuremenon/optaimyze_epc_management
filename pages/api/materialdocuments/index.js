import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  // handle different methods
  try {
    switch (req.method) {
      case "GET": {
        const { db } = await connectToDatabase();
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 100;
        
        // Extract discrete search parameters
        const po = req.query.po || "";
        const matCode = req.query.matCode || "";
        const desc = req.query.desc || "";
        const wbs = req.query.wbs || "";

        let query = {};

        // Helper to match both number and string representation
        const buildExactMatch = (val) => {
          const numVal = Number(val);
          return !isNaN(numVal) ? { $in: [val, numVal] } : val;
        };

        if (po) {
          query["ponumber"] = buildExactMatch(po);
        }

        if (matCode) {
          query["material"] = buildExactMatch(matCode);
        }

        if (desc) {
          query["materialdescription"] = new RegExp(desc, "i");
        }

        if (wbs) {
          // WBS can be in account.wbs or account.network, and could be string or number
          const wbsRegex = new RegExp(wbs, "i");
          query.$or = [
             { "account.wbs": wbsRegex },
             { "account.network": wbsRegex },
             { "account.wbs": buildExactMatch(wbs) },
             { "account.network": buildExactMatch(wbs) }
          ];
        }

        const skipCount = (page > 0 ? page - 1 : 0) * limit;

        const matdoclist = await db
          .collection("materialdocumentsforpo")
          .find(query)
          .sort({ "documentdate": -1 })
          .limit(limit)
          .skip(skipCount)
          .toArray();

        return res.json(matdoclist);
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};
export default handler;
