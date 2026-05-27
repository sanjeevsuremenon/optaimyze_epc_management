import { connectToDatabase } from  "../../../lib/mongoconnect";

const handler =  async (req, res) => {
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
              condition = {'material-description': {'$regex': regexsearchstring}};
            }
          }

          // // const searchstr = new RegExp(searchlist.join('|'), 'gi')
          
          const matlist = await db
            .collection("materials")
            .find(condition)
            .sort({ "updated-date": -1 })
            .limit(300)
            .toArray();
          // console.log(matlist)
          return res.json(matlist);          
        } 

        case "POST": {
          const { db } = await connectToDatabase();
          const matNew = await db.collection("materials").insertOne(req.body);
          return res.status(200).json({matgroup: matgroupNew, message: "Successfully inserted new material"});
          
        }

        default:
          return res.json({ error: "Method not supported" });
      }
    
  } catch (error) {
    console.log(error)
  }
  
}
export default handler  