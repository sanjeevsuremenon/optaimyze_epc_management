import { connectToDatabase } from "../../../../lib/mongoconnect";

const handler = async (req, res) => {
  const { venname } = req.query;
  const { db } = await connectToDatabase();
  
  try {
    switch (req.method) {
      case "GET": {
        const vendorcomments = await db
          .collection("vendorcomments")
          .find({ "vendorname": venname }).toArray()

        return res.json(vendorcomments);
      }
     
      case "POST": {
       const {title, comment, user} = req.body

       if (!title || !comment) {
        return res.status(400).send("data is missing or invalid.");
      }

      const vendorcomment = await db
          .collection("vendorcomments")
          .insertOne({ vendorname: venname, title: title, comment: comment, updatedBy: user, updatedAt: new Date() });

        // console.log(user)
        return res.status(200).json({ message: "success!" });
      }

      default:
        return res.json({ error: "Method not supported" });
    }
  } catch (error) {
    console.log(error);
  }
};

export default handler;
