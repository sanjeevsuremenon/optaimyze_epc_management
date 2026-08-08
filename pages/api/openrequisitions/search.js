import { connectToDatabase } from '../../../lib/mongoconnect';

/**
 * GET /api/openrequisitions/search?str=...
 * Search open PRs by PR number (and related fields).
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const str = String(req.query.str || '').trim();

    if (!str || str.length < 2) {
      return res.status(200).json([]);
    }

    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapeRegex(str), 'i');

    const results = await db
      .collection('openrequisitions')
      .find({
        $or: [
          { 'pr-number': regex },
          { prNumber: regex },
          { prnumber: regex },
          { 'requisition-number': regex },
          { materialcode: regex },
          { 'material-code': regex },
        ],
      })
      .sort({ 'pr-number': 1 })
      .limit(50)
      .toArray();

    // Normalize so forms can read pr["pr-number"]
    const normalized = results.map((row) => ({
      ...row,
      'pr-number':
        row['pr-number'] ||
        row.prNumber ||
        row.prnumber ||
        row['requisition-number'] ||
        '',
    }));

    return res.status(200).json(normalized);
  } catch (error) {
    console.error('openrequisitions search error:', error);
    return res.status(500).json({ error: 'Failed to search open requisitions' });
  }
}
