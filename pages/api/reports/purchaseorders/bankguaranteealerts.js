import { connectToDatabase } from '../../../../lib/mongoconnect';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Get today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('Searching for POs with open bank guarantees');

    // Step 3: Find POs with expired bank guarantees (no open PO filter)
    const openBGPOs = await db.collection('poschedule').aggregate([
      {
        $match: {
          $or: [
            // ABG (Advance Bank Guarantee) - has expiry date but not returned
            {
              'bgdata.abgexpirydate': {
                $exists: true,
                $ne: null,
                $lt: today
              },
              'bgdata.abgreturneddate': {
                $in: [null, '']
              }
            },
            // PBG (Performance Bank Guarantee) - has expiry date but not returned
            {
              'bgdata.pbgexpirydate': {
                $exists: true,
                $ne: null,
                $lt: today
              },
              'bgdata.pbgreturneddate': {
                $in: [null, '']
              }
            }
          ]
        }
      },
      {
        $project: {
          ponumber: 1,
          bgdata: 1,
          openBGs: {
            $filter: {
              input: [
                {
                  type: 'ABG',
                  estdate: '$bgdata.abgestdate',
                  actualdate: '$bgdata.abgactualdate',
                  expirydate: '$bgdata.abgexpirydate',
                  amount: '$bgdata.abgamount',
                  returneddate: '$bgdata.abgreturneddate',
                  remarks: '$bgdata.bgremarks',
                  isExpired: {
                    $and: [
                      { $ne: ['$bgdata.abgexpirydate', null] },
                      { $lt: ['$bgdata.abgexpirydate', today] },
                      { $in: ['$bgdata.abgreturneddate', [null, '']] }
                    ]
                  }
                },
                {
                  type: 'PBG',
                  estdate: '$bgdata.pbgestdate',
                  actualdate: '$bgdata.pbgactualdate',
                  expirydate: '$bgdata.pbgexpirydate',
                  amount: '$bgdata.pbgamount',
                  returneddate: '$bgdata.pbgreturneddate',
                  remarks: '$bgdata.bgremarks',
                  isExpired: {
                    $and: [
                      { $ne: ['$bgdata.pbgexpirydate', null] },
                      { $lt: ['$bgdata.pbgexpirydate', today] },
                      { $in: ['$bgdata.pbgreturneddate', [null, '']] }
                    ]
                  }
                }
              ],
              as: 'bgInfo',
              cond: { $eq: ['$$bgInfo.isExpired', true] }
            }
          }
        }
      },
      {
        $match: {
          'openBGs.0': { $exists: true }
        }
      },
      {
        $sort: {
          'bgdata.abgexpirydate': 1,
          'bgdata.pbgexpirydate': 1
        }
      }
    ]).toArray();

    console.log('Found open POs with expired bank guarantees:', openBGPOs.length);

    // Step 4: Fetch PO details from purchaseorders for all relevant POs
    const poNumbers = openBGPOs.map(po => po.ponumber);
    const purchaseOrders = await db.collection('purchaseorders').find({ 'po-number': { $in: poNumbers } }).toArray();
    // Build a lookup map for poDetails
    const poDetailsMap = {};
    purchaseOrders.forEach(po => {
      // Use the first occurrence for each PO number
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
    const formattedResults = openBGPOs.map(po => {
      return {
        ponumber: po.ponumber,
        poDetails: poDetailsMap[po.ponumber] || null,
        bgdata: po.bgdata,
        openBGs: po.openBGs,
        daysOverdue: po.openBGs.map(bgInfo => {
          const expiryDate = new Date(bgInfo.expirydate);
          const diffTime = today.getTime() - expiryDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return {
            type: bgInfo.type,
            expirydate: bgInfo.expirydate,
            amount: bgInfo.amount,
            daysOverdue: diffDays
          };
        })
      };
    });

    res.status(200).json(formattedResults);
  } catch (error) {
    console.error('Error fetching bank guarantee alerts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 