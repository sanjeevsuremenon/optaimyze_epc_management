import { connectToDatabase } from '../../../lib/mongoconnect';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Get all unique POs that have comments
    const poList = await db.collection('pocomments')
      .aggregate([
        {
          $group: {
            _id: '$ponumber',
            title: { $first: '$title' },
            commentCount: { $sum: 1 },
            lastUpdated: { $max: '$updatedAt' },
            lastUpdatedBy: { 
              $first: {
                $cond: [
                  { $eq: [{ $max: '$updatedAt' }, '$updatedAt'] },
                  '$updatedBy',
                  null
                ]
              }
            }
          }
        },
        {
          $project: {
            ponumber: '$_id',
            title: 1,
            commentCount: 1,
            lastUpdated: 1,
            lastUpdatedBy: 1,
            _id: 0
          }
        },
        {
          $sort: { lastUpdated: -1 }
        }
      ])
      .toArray();

    // Fix lastUpdatedBy by finding the actual user who made the last update
    // Also fetch PO details (date, value, vendor name) from purchaseorders collection
    for (let po of poList) {
      const lastComment = await db.collection('pocomments')
        .findOne(
          { ponumber: po.ponumber, updatedAt: po.lastUpdated },
          { projection: { updatedBy: 1 } }
        );
      if (lastComment) {
        po.lastUpdatedBy = lastComment.updatedBy;
      }

      // Fetch PO details from purchaseorders collection
      const poDetails = await db.collection('purchaseorders')
        .aggregate([
          { $match: { 'po-number': po.ponumber } },
          {
            $group: {
              _id: '$po-number',
              podate: { $first: '$po-date' },
              vendorname: { 
                $first: { 
                  $ifNull: ['$vendorname', '$vendor-name'] 
                } 
              },
              vendorcode: { 
                $first: { 
                  $ifNull: ['$vendorcode', '$vendor-code'] 
                } 
              },
              poval: { $sum: { $ifNull: ['$po-value-sar', 0] } }
            }
          }
        ])
        .toArray();

      if (poDetails && poDetails.length > 0) {
        po.podate = poDetails[0].podate;
        po.vendorname = poDetails[0].vendorname || 'N/A';
        po.vendorcode = poDetails[0].vendorcode || 'N/A';
        po.poval = poDetails[0].poval || 0;
      } else {
        po.podate = null;
        po.vendorname = 'N/A';
        po.vendorcode = 'N/A';
        po.poval = 0;
      }
    }

    return res.status(200).json(poList);
  } catch (error) {
    console.error('Error fetching PO comments list:', error);
    return res.status(500).json({ error: 'Failed to fetch PO comments list' });
  }
}

