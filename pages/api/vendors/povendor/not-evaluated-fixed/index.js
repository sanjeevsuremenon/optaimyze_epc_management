import { connectToDatabase } from "../../../../../lib/mongoconnect";

const handler = async (req, res) => {
  try {
    switch (req.method) {
      case "GET": {
        const { db } = await connectToDatabase();
        
        // Step 1: Get vendors with POs in 2024
        const vendorsWithPO = await db.collection("vendorsandtheirpo").aggregate([
          { $match: { vendorpo: { $ne: [], $exists: true } } },
          { $unwind: { path: "$vendorpo", preserveNullAndEmptyArrays: false } },
          { $addFields: { year: { $year: "$vendorpo.po-date" } } },
          { $match: { year: { $in: [2024] } } },
          { $group: { 
              _id: "$vendor-code", 
              count: { $sum: 1 }, 
              "vendor-name": { $first: "$vendor-name" }, 
              "vendor-code": { $first: "$vendor-code" } 
            } 
          },
          { $project: { _id: 0, "vendor-code": 1, "vendor-name": 1 } }
        ]).toArray();

        // Step 2: Get all vendors who have fixedeval in vendorevaluation collection
        const vendorsWithFixedEval = await db.collection("vendorevaluation")
          .find({ 
            $or: [
              { fixedeval: { $exists: true, $ne: [] } },
              { fixedevalyear2024: { $exists: true } }
            ]
          })
          .project({ vendorcode: 1, _id: 0 })
          .toArray();

        // Create a set of vendor codes that have fixedeval
        const evaluatedVendorCodes = new Set(
          vendorsWithFixedEval.map(v => v.vendorcode?.toString())
        );

        // Step 3: Filter out vendors who have been evaluated
        const vendorsNotEvaluated = vendorsWithPO.filter(vendor => {
          const vendorCode = vendor["vendor-code"]?.toString();
          return !evaluatedVendorCodes.has(vendorCode);
        });

        return res.status(200).json(vendorsNotEvaluated);
      }
      default: {
        return res.status(405).json({ message: "Method not allowed" });        
      }
    }
  } catch (error) {
    console.error("Error fetching vendors not evaluated for fixed scores:", error);
    res.status(500).json({ message: error.message });
  }
};

export default handler;

