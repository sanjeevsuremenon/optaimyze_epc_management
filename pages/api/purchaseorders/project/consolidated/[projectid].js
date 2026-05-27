import { connectToDatabase } from "../../../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { projectid } = req.query;
  const { db } = await connectToDatabase();

  try {
    switch (req.method) {
      case "GET": {       
        
        const purchaseorders = await db
          .collection("purchaseorders")
          .find(
            {$expr: {
              $eq: [{ $substr: ["$account.wbs", 0, 12] }, projectid]
            }
            } 
          ).toArray()
          
          let result = []

          purchaseorders.reduce((res,value) => {
            if (!res[value["po-number"]]){
              // Handle both possible field name formats
              const vendorcode = value["vendorcode"] || value["vendor-code"] || "";
              const vendorname = value["vendorname"] || value["vendor-name"] || "";
              
              res[value["po-number"]] = {
                ponum: value["po-number"], 
                podate: value["po-date"], 
                "delivery-date": value["delivery-date"],
                vendorcode: vendorcode, 
                vendorname: vendorname, 
                poval:0, 
                balgrval:0
              }
              
              result.push(res[value["po-number"]])
              
            }
            res[value["po-number"]].poval += value["po-value-sar"] || 0;
            res[value["po-number"]].balgrval += value["pending-val-sar"] || 0;
            return res
          }, {})

          return res.json(result)
      }  
      
      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};

export default handler;
