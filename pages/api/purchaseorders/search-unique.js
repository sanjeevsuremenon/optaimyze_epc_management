import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  try {
    switch (req.method) {
      case "GET": {
        const { db } = await connectToDatabase();
        const str = req.query.str;
        const projectWbs = req.query.projectWbs;
        
        // Build match conditions
        let matchConditions = [];
        
        // Filter by project WBS if provided (first 12 characters of account.wbs)
        if (projectWbs) {
          matchConditions.push({
            $expr: {
              $eq: [{ $substr: ["$account.wbs", 0, 12] }, projectWbs.substring(0, 12)]
            }
          });
        }
        
        // Filter by PO number search term if provided
        if (str) {
          matchConditions.push({ "po-number": { $regex: str, $options: 'i' } });
        }
        
        let matchCondition = matchConditions.length > 0 
          ? (matchConditions.length === 1 ? matchConditions[0] : { $and: matchConditions })
          : {};
        
        // Aggregate to get unique POs with vendor info
        const poList = await db
          .collection("purchaseorders")
          .aggregate([
            {
              $match: matchCondition
            },
            {
              $group: {
                _id: "$po-number",
                "po-number": { $first: "$po-number" },
                "po-date": { $first: "$po-date" },
                vendorcode: { $first: { $ifNull: ["$vendorcode", "$vendor-code", ""] } },
                vendorname: { $first: { $ifNull: ["$vendorname", "$vendor-name", ""] } },
                poval: { $sum: { $ifNull: ["$po-value-sar", 0] } },
                balgrval: { $sum: { $ifNull: ["$pending-val-sar", 0] } }
              }
            },
            {
              $sort: { "po-date": -1 }
            },
            {
              $limit: 100
            }
          ])
          .toArray();
          
        return res.json(poList);
      }
      
      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default handler;
