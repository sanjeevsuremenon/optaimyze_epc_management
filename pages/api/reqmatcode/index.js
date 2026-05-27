import { connectToDatabase } from  "../../../lib/mongoconnect";

const handler =  async (req, res) => {
  // handle different methods
  try {
    switch (req.method) {
        case "GET": {
          const { db } = await connectToDatabase();
          const vendorlist = await db.collection("matcoderequests").find({}).toArray();
          return res.json(matcodereqlist);
          
        } 

        case "POST": {
          const {db} = await connectToDatabase();
          const newmatcodereq = await db.collection("matcoderequests").insertOne(
            {
              mattypeselected: req.body.mattypeselected,
              matgroupselected: req.body.matgroupselected,
              secondarymatgroupselected: req.body.secondarymatgroupselected,
              newdescription: req.body.newdescription,              
              longDesc: req.body.longDesc,
              created_by: req.body.user,
              created_at: new Date(),
              uom: req.body.uom,
              
            }
          )
            
          
          return  res.status(201).json({ message: 'request for matcode registered successfully' });
        }
       
        default:
          return res.json({ error: "Method not supported" });
      }
    
  } catch (error) {
    console.log(error)
  }
  
}
export default handler  