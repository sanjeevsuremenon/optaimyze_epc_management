import { connectToDatabase } from "../../../../lib/mongoconnect";

export default async function handler(req, res) {
  const { vendorcode } = req.query;

  if (!vendorcode) {
    return res.status(400).json({ error: 'Vendor code is required' });
  }

  try {
    const { db } = await connectToDatabase();

    switch (req.method) {
      case 'GET': {
        // Fetch all documents for the vendor
        const documents = await db.collection('vendordocuments')
          .find({ vendorCode: vendorcode })
          .sort({ uploadedAt: -1 }) // Sort by upload date, newest first
          .toArray();

        return res.status(200).json(documents);
      }

      case 'DELETE': {
        // Delete all documents for the vendor (if needed)
        const result = await db.collection('vendordocuments')
          .deleteMany({ vendorCode: vendorcode });

        return res.status(200).json({
          success: true,
          message: `${result.deletedCount} documents deleted`,
          deletedCount: result.deletedCount
        });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      error: 'An error occurred while fetching documents' 
    });
  }
}
