import { connectToDatabase } from "../../../../../lib/mongoconnect";

const handler = async (req, res) => {
  try {
    switch (req.method) {
      case "GET": {
        const { db } = await connectToDatabase();
        const vendorpolist = await db.collection("vendorsandtheirpo").aggregate([
          { $match: { vendorpo: { $ne: [], $exists: true }, }, },
          { $unwind: { path: "$vendorpo", preserveNullAndEmptyArrays: false }, },
          // All years through today (no hard-coded year filter)
          {
            $match: {
              $or: [
                { "vendorpo.po-date": { $lte: new Date(new Date().setHours(23, 59, 59, 999)) } },
                { "vendorpo.po-date": { $exists: false } },
                { "vendorpo.po-date": null },
              ],
            },
          },
          { $group: { _id: "$vendor-code", count: { $sum: 1 }, "vendor-name": { $first: "$vendor-name" }, "vendor-code": { $first: "$vendor-code" }, }, },
          { $project: { _id: 0, "vendor-code": 1, "vendor-name": 1 } ,}
        ]).toArray();

        // Get vendor names that have at least one group mapping (vendormapgroup)
        const mappedVendors = await db.collection("vendormapgroup").distinct("vendorname");
        const mappedSet = new Set((mappedVendors || []).map((n) => (n || "").trim()));

        const withMappedFlag = vendorpolist.map((v) => ({
          ...v,
          mapped: mappedSet.has((v["vendor-name"] || "").trim()),
        }));

        return res.status(200).json(withMappedFlag);
      }
      default: {
        return res.status(405).json({ message: "Method not allowed" });        
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default handler;
