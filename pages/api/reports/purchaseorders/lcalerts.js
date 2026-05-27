import { connectToDatabase } from '../../../../lib/mongoconnect';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Get today's date and 1 month from today for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const oneMonthFromToday = new Date();
    oneMonthFromToday.setMonth(oneMonthFromToday.getMonth() + 1);
    oneMonthFromToday.setHours(0, 0, 0, 0);

    console.log('Searching for POs with LC alerts');

    // Step 3: Find POs with LC alerts (expired or expiring within 1 month, no open PO filter)
    const openLCPOs = await db.collection('poschedule').aggregate([
      {
        $match: {
          'lcdata.lcopeneddate': {
            $exists: true,
            $ne: null
          },
          $or: [
            // LC is already expired
            {
              'lcdata.lcexpirydate': {
                $exists: true,
                $ne: null,
                $lt: today
              }
            },
            // LC expires within 1 month
            {
              'lcdata.lcexpirydate': {
                $exists: true,
                $ne: null,
                $gte: today,
                $lte: oneMonthFromToday
              }
            }
          ]
        }
      },
      {
        $project: {
          ponumber: 1,
          lcdata: 1,
          lcAlert: {
            openeddate: '$lcdata.lcopeneddate',
            expirydate: '$lcdata.lcexpirydate',
            amount: '$lcdata.lcamount',
            incoterm: '$lcdata.lcincoterm',
            documents: '$lcdata.lcdocuments',
            remarks: '$lcdata.lcremarks',
            swift: '$lcdata.lcswift',
            isExpired: {
              $and: [
                { $ne: ['$lcdata.lcexpirydate', null] },
                { $lt: ['$lcdata.lcexpirydate', today] }
              ]
            },
            daysUntilExpiry: {
              $cond: {
                if: { $ne: ['$lcdata.lcexpirydate', null] },
                then: {
                  $ceil: {
                    $divide: [
                      {
                        $subtract: [
                          '$lcdata.lcexpirydate',
                          today
                        ]
                      },
                      1000 * 60 * 60 * 24
                    ]
                  }
                },
                else: null
              }
            }
          }
        }
      },
      {
        $match: {
          'lcAlert.expirydate': { $ne: null }
        }
      },
      {
        $sort: {
          'lcAlert.expirydate': 1
        }
      }
    ]).toArray();

    // Step 4: Fetch PO details from purchaseorders for all relevant POs
    const poNumbers = openLCPOs.map(po => po.ponumber);
    const purchaseOrders = await db.collection('purchaseorders').find({ 'po-number': { $in: poNumbers } }).toArray();
    // Build a lookup map for poDetails
    const poDetailsMap = {};
    purchaseOrders.forEach(po => {
      if (!poDetailsMap[po['po-number']]) {
        poDetailsMap[po['po-number']] = {
          vendorcode: po.vendorcode || '',
          vendorname: po.vendorname || '',
          plant: po['plant-code'] || '',
          openvalue: po['pending-val-sar'] || 0,
          totalPoValue: po['po-value-sar'] || 0
        };
      }
    });

    // Step 5: Combine the data and format the response
    const formattedResults = openLCPOs.map(po => {
      return {
        ponumber: po.ponumber,
        poDetails: poDetailsMap[po.ponumber] || null,
        lcdata: po.lcdata,
        lcAlert: po.lcAlert,
        daysOverdue: po.lcAlert.isExpired ? Math.abs(po.lcAlert.daysUntilExpiry) : 0,
        daysUntilExpiry: po.lcAlert.daysUntilExpiry
      };
    });

    res.status(200).json(formattedResults);
  } catch (error) {
    console.error('Error fetching LC alerts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 