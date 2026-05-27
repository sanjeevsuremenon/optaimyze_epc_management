import { connectToDatabase } from '../../../../lib/mongoconnect';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Get today's date at start of day for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('DEBUG: Today is', today, today.toISOString());
    console.log('Searching for open POs with delivery dates before:', today.toISOString());

    // Step 1: First identify open POs (where sum of pending-val-sar > 0)
    const openPOs = await db.collection('purchaseorders').aggregate([
      {
        $group: {
          _id: {
            'po-number': '$po-number',
            'plant': '$plant-code',
            'vendorcode': '$vendorcode',
            'vendorname': '$vendorname'
          },
          totalPoValue: { $sum: '$po-value-sar' },
          totalPendingValue: { $sum: '$pending-val-sar' }
        }
      },
      {
        $match: {
          totalPendingValue: { $gt: 0 }
        }
      },
      {
        $project: {
          ponumber: '$_id.po-number',
          plant: '$_id.plant',
          vendorcode: '$_id.vendorcode',
          vendorname: '$_id.vendorname',
          totalPoValue: 1,
          totalPendingValue: 1,
          openValue: '$totalPendingValue'
        }
      }
    ]).toArray();

    console.log('Found open POs:', openPOs.length);

    // Step 2: Get the PO numbers of open POs
    const openPONumbers = openPOs.map(po => po.ponumber);

    console.log('Open PO Numbers:', openPONumbers);

    // Debug: Print the poschedule document for PO 4500001072
    const testPO = await db.collection('poschedule').findOne({ ponumber: "4500001072" });
    console.log('Test PO poschedule doc:', testPO);

    // Step 3: Find open POs with passed delivery dates
    const passedDeliveryPOs = await db.collection('poschedule').aggregate([
      {
        $match: {
          ponumber: { $in: openPONumbers },
          $or: [
            {
              'generaldata.podelydate': {
                $exists: true,
                $ne: null,
                $lt: today
              }
            },
            {
              'generaldata.estdelydate': {
                $exists: true,
                $ne: null,
                $lt: today
              }
            }
          ]
        }
      },
      {
        $project: {
          ponumber: 1,
          generaldata: 1,
          passedDates: {
            $filter: {
              input: [
                {
                  field: 'podelydate',
                  date: '$generaldata.podelydate',
                  passed: {
                    $and: [
                      { $ne: ['$generaldata.podelydate', null] },
                      { $lt: ['$generaldata.podelydate', today] }
                    ]
                  }
                },
                {
                  field: 'estdelydate',
                  date: '$generaldata.estdelydate',
                  passed: {
                    $and: [
                      { $ne: ['$generaldata.estdelydate', null] },
                      { $lt: ['$generaldata.estdelydate', today] }
                    ]
                  }
                }
              ],
              as: 'dateInfo',
              cond: { $eq: ['$$dateInfo.passed', true] }
            }
          }
        }
      },
      {
        $match: {
          'passedDates.0': { $exists: true }
        }
      },
      {
        $sort: {
          'generaldata.podelydate': 1,
          'generaldata.estdelydate': 1
        }
      }
    ]).toArray();

    console.log('Found open POs with passed delivery dates:', passedDeliveryPOs.length);

    // Step 4: Combine the data and format the response, ensuring each PO appears only once
    const formattedResults = passedDeliveryPOs.map(po => {
      // Find the corresponding open PO data
      const openPOData = openPOs.find(openPO => openPO.ponumber === po.ponumber);
      
      return {
        ponumber: po.ponumber,
        poDetails: {
          vendorcode: openPOData ? openPOData.vendorcode : '',
          vendorname: openPOData ? openPOData.vendorname : '',
          plant: openPOData ? openPOData.plant : '',
          openvalue: openPOData ? openPOData.openValue : 0,
          totalPoValue: openPOData ? openPOData.totalPoValue : 0,
          totalPendingValue: openPOData ? openPOData.totalPendingValue : 0
        },
        generaldata: po.generaldata,
        passedDates: po.passedDates,
        daysOverdue: po.passedDates.map(dateInfo => {
          const passedDate = new Date(dateInfo.date);
          const diffTime = today.getTime() - passedDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return {
            field: dateInfo.field,
            date: dateInfo.date,
            daysOverdue: diffDays
          };
        })
      };
    });

    res.status(200).json(formattedResults);
  } catch (error) {
    console.error('Error fetching delivery date passed POs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 