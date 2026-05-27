import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  try {
    switch (req.method) {
      case "GET": {
        const { db } = await connectToDatabase();
        const { vendor, project, material, ponumber } = req.query;
        
        let conditions = [];
        
        // Helper function to build regex pattern from search string with wildcards
        const buildRegexPattern = (searchStr) => {
          if (!searchStr || !searchStr.trim()) return null;
          
          // Clean the string: remove leading/trailing asterisks
          let cleanedStr = searchStr.trim().replace(/^\*+|\*+$/g, '');
          
          // Split by * and filter out empty strings
          let searchTerms = cleanedStr.split('*')
            .map(term => term.trim())
            .filter(term => term.length > 0)
            .slice(0, 4); // Limit to maximum 4 search terms
          
          if (searchTerms.length === 0) return null;
          
          // Escape special regex characters for each term
          const escapeRegex = (string) => {
            return string.replace(/[.*+?^${}()[\]\\/]/g, '\\$&');
          };
          
          // Build regex pattern: each term must appear anywhere
          let regexPattern = '';
          searchTerms.forEach((term) => {
            const escapedTerm = escapeRegex(term);
            regexPattern += `(?=.*${escapedTerm})`;
          });
          
          regexPattern = `^${regexPattern}.*$`;
          return new RegExp(regexPattern, 'i');
        };
        
        // Build conditions for each search type (OR logic)
        if (vendor) {
          const vendorRegex = buildRegexPattern(vendor);
          if (vendorRegex) {
            conditions.push({ "vendorname": { $regex: vendorRegex } });
            conditions.push({ "vendor-name": { $regex: vendorRegex } });
          }
        }
        
        if (project) {
          const projectRegex = buildRegexPattern(project);
          if (projectRegex) {
            conditions.push({ "account.wbs": { $regex: projectRegex } });
          }
        }
        
        if (material) {
          const materialRegex = buildRegexPattern(material);
          if (materialRegex) {
            conditions.push({ "material.matdescription": { $regex: materialRegex } });
          }
        }
        
        if (ponumber) {
          const poRegex = buildRegexPattern(ponumber);
          if (poRegex) {
            conditions.push({ "po-number": { $regex: poRegex } });
          }
        }
        
        // If no conditions, return empty array
        if (conditions.length === 0) {
          return res.json([]);
        }
        
        // Use $or to combine all conditions
        const query = { $or: conditions };
        
        // Get unique POs by grouping
        const poList = await db
          .collection("purchaseorders")
          .aggregate([
            { $match: query },
            {
              $group: {
                _id: "$po-number",
                "po-number": { $first: "$po-number" },
                "po-date": { $first: "$po-date" },
                "delivery-date": { $first: "$delivery-date" },
                vendorcode: { $first: "$vendorcode" },
                vendorname: { $first: "$vendorname" },
                "vendor-name": { $first: "$vendor-name" },
                "vendor-code": { $first: "$vendor-code" }
              }
            },
            { $sort: { "po-date": -1 } },
            { $limit: 100 }
          ])
          .toArray();
        
        // Transform the results
        const result = poList.map(po => ({
          ponum: po["po-number"],
          podate: po["po-date"],
          "delivery-date": po["delivery-date"],
          vendorcode: po.vendorcode || po["vendor-code"] || "",
          vendorname: po.vendorname || po["vendor-name"] || ""
        }));
        
        return res.json(result);
      }
      
      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default handler;
