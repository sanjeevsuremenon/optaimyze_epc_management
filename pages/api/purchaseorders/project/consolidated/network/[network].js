import { connectToDatabase } from "../../../../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { network } = req.query;
  console.log(network)
  const { db } = await connectToDatabase();

  try {
    switch (req.method) {
      case "GET": {       
        
        const purchaseorders = await db
          .collection("purchaseorders")
          .find({
            "account.network": network,
            $or: [
              { "account.wbs": { $exists: false } },
              { "account.wbs": null }
            ]
          }).toArray()

        console.log("Fetched purchaseorders for network", network, purchaseorders);
          
        // const povalue = purchaseorders.reduce((total,current) => current["po-value-sar"] + total, 0)
        // const balgrvalue = purchaseorders.reduce((total, current) => current["pending-val-sar"] + total, 0)
        // return res.json({ponum:purchaseorders[0]["po-number"],povalue, balgrvalue})

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
