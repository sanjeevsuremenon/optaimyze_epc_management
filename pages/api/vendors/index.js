import { connectToDatabase } from "../../../lib/mongoconnect";

const handler = async (req, res) => {
  
  // handle different methods
  try {
    switch (req.method) {
      
      case "GET": {
        const { db } = await connectToDatabase();
        const str = req.query.str
        
        let condition = {};
        
        if(str){
          // Clean the string: remove leading/trailing asterisks
          let cleanedStr = str.trim().replace(/^\*+|\*+$/g, '');
          
          // Split by * and filter out empty strings
          let searchTerms = cleanedStr.split('*')
            .map(term => term.trim())
            .filter(term => term.length > 0)
            .slice(0, 4); // Limit to maximum 4 search terms
          
          if(searchTerms.length > 0){
            // Escape special regex characters for each term
            // Special characters that need escaping: . * + ? ^ $ { } [ ] ( ) | \ /
            const escapeRegex = (string) => {
              return string.replace(/[.*+?^${}()[\]\\/]/g, '\\$&');
            };
            
            // Build regex pattern: each term must appear anywhere in the description
            // Using positive lookahead to ensure all terms are present
            let regexPattern = '';
            searchTerms.forEach((term, index) => {
              const escapedTerm = escapeRegex(term);
              regexPattern += `(?=.*${escapedTerm})`;
            });
            
            // Match the entire string with all terms present
            regexPattern = `^${regexPattern}.*$`;
            
            var regexsearchstring = new RegExp(regexPattern, 'i');
            condition = {'vendor-name': {'$regex': regexsearchstring}};
          }
        }
        
          const vendorlist = await db
            .collection("vendors")
            // .find({$expr: { $lt: [0.8, { $rand: {} }] }})
            .find(condition)
            .sort({ 'created_date': -1 })            
            .limit(50)
            .toArray();
          return res.json(vendorlist);
        
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
    console.log(error);
  }
};
export default handler;
