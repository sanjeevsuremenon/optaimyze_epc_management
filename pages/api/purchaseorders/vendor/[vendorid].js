import { connectToDatabase } from "../../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { vendorid } = req.query;
  const { db } = await connectToDatabase();

  
  try {
    switch (req.method) {
      
      case "GET": {       
        
        const purchaseorders = await db
          .collection("purchaseorders")
          .find(
            {"vendorcode": vendorid
            } 
          ).toArray()
          
          // const povalue = purchaseorders.reduce((total,current) => current["po-value-sar"] + total, 0)
          // const balgrvalue = purchaseorders.reduce((total, current) => current["pending-val-sar"] + total, 0)
          // return res.json({ponum:purchaseorders[0]["po-number"],povalue, balgrvalue})

          let result = []

          purchaseorders.reduce((res,value) => {
            if (!res[value["po-number"]]){
              res[value["po-number"]] = {
                ponum: value["po-number"], 
                podate: value["po-date"], 
                "delivery-date": value["delivery-date"],
                vendor: value["vendorname"], 
                poval:0, 
                balgrval:0
              }
              
              result.push(res[value["po-number"]])
              
            }
            res[value["po-number"]].poval += value["po-value-sar"];
            res[value["po-number"]].balgrval += value["pending-val-sar"]
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
