import { connectToDatabase } from  "../../../../lib/mongoconnect";

const handler =  async (req, res) => {

    const { projectid } = req.query;
  // handle different methods
  try {
    switch (req.method) {
        case "GET": {
          const { db } = await connectToDatabase();
          const projectFileList = await db.collection("projectsfiles").find({"projectid":projectid}).toArray();
          return res.json(projectFileList);
          
        } 
 
        default:
          return res.json({ error: "Method not supported" });
      }
    
  } catch (error) {
    console.log(error)
  }
  
}
export default handler  