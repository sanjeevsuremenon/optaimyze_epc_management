import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  try {
    switch (req.method) {
      case "GET": {
        const { db } = await connectToDatabase();
        const str = req.query.str;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        let condition = {};
        
        if (str) {
          // Clean the string: remove leading/trailing asterisks
          let cleanedStr = str.trim().replace(/^\*+|\*+$/g, '');
          
          // Split by * and filter out empty strings
          let searchTerms = cleanedStr.split('*')
            .map(term => term.trim())
            .filter(term => term.length > 0)
            .slice(0, 4); // Limit to maximum 4 search terms
          
          if (searchTerms.length > 0) {
            // Escape special regex characters for each term
            const escapeRegex = (string) => {
              return string.replace(/[.*+?^${}()[\]\\/]/g, '\\$&');
            };
            
            // Build regex pattern: each term must appear anywhere in the description
            // Using positive lookahead to ensure all terms are present
            let regexPattern = '';
            searchTerms.forEach((term) => {
              const escapedTerm = escapeRegex(term);
              regexPattern += `(?=.*${escapedTerm})`;
            });
            
            // Match the entire string with all terms present
            regexPattern = `^${regexPattern}.*$`;
            
            const regexsearchstring = new RegExp(regexPattern, 'i');
            
            // Search in both vendor-name and vendor-code
            condition = {
              $or: [
                { 'vendor-name': { '$regex': regexsearchstring } },
                { 'vendor-code': { '$regex': regexsearchstring } }
              ]
            };
          }
        }
        
        const vendorlist = await db
          .collection("vendors")
          .find(condition)
          .sort({ 'created_date': -1, 'vendor-name': 1 })            
          .skip(skip)
          .limit(limit)
          .toArray();

        // Also get total count for pagination metadata
        const totalCount = await db.collection("vendors").countDocuments(condition);
        const hasMore = skip + vendorlist.length < totalCount;

        return res.json({
          vendors: vendorlist,
          hasMore,
          totalCount,
          page,
          limit
        });
      }

      case "POST": {
        const { db } = await connectToDatabase();
        const venNew = await db.collection("vendors").insertOne(req.body);
        return res
          .status(200)
          .json({
            vendor: venNew,
            message: "Successfully inserted new vendor",
          });
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.error("API /vendors error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default handler;
