import { connectToDatabase } from '../../../lib/mongoconnect';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Fetch logs from all collections (limited to 100 each)
    const [prLogs, poLogs, deliveryLogs, postDeliveryLogs] = await Promise.all([
      db.collection('prlogs').find({}).sort({ createdDate: -1 }).limit(100).toArray(),
      db.collection('pologs').find({}).sort({ createdDate: -1 }).limit(100).toArray(),
      db.collection('deliverylogs').find({}).sort({ createdDate: -1 }).limit(100).toArray(),
      db.collection('postdeliverylogs').find({}).sort({ createdDate: -1 }).limit(100).toArray()
    ]);

    // Transform logs to unified format
    const transformedLogs = [
      ...prLogs.map(log => ({
        ...log,
        type: 'open PR',
        id: log._id.toString(),
        title: log.title || `PR - ${log.prNumber}`,
        requestInfo: log.requestInfo || log.title,
        createdBy: log.createdBy,
        createdDate: log.createdDate,
        status: log.status || 'open',
        priority: log.priority || 'medium',
        lastUpdated: log.lastUpdated || log.createdDate,
        assignedTo: log.assignedTo
      })),
      ...poLogs.map(log => ({
        ...log,
        type: 'open PO',
        id: log._id.toString(),
        title: log.title || `PO - ${log.poNumber}`,
        requestInfo: log.requestInfo || log.title,
        createdBy: log.createdBy,
        createdDate: log.createdDate,
        status: log.status || 'open',
        priority: log.priority || 'medium',
        lastUpdated: log.lastUpdated || log.createdDate,
        assignedTo: log.assignedTo
      })),
      ...deliveryLogs.map(log => ({
        ...log,
        type: 'open delivery',
        id: log._id.toString(),
        title: log.title || `Delivery - ${log.deliveryRef}`,
        requestInfo: log.requestInfo || log.title,
        createdBy: log.createdBy,
        createdDate: log.createdDate,
        status: log.status || 'open',
        priority: log.priority || 'medium',
        lastUpdated: log.lastUpdated || log.createdDate,
        assignedTo: log.assignedTo
      })),
      ...postDeliveryLogs.map(log => ({
        ...log,
        type: 'post delivery',
        id: log._id.toString(),
        title: log.title || `Post Delivery - ${log.poReference}`,
        requestInfo: log.requestInfo || log.title,
        createdBy: log.createdBy,
        createdDate: log.createdDate,
        status: log.status || 'open',
        priority: log.priority || 'medium',
        lastUpdated: log.lastUpdated || log.createdDate,
        assignedTo: log.assignedTo
      }))
    ];

    // Sort all logs by created date (newest first) and limit to 100 total
    transformedLogs.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    const limitedLogs = transformedLogs.slice(0, 100);

    return res.status(200).json(limitedLogs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
} 