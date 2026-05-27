import { connectToDatabase } from '../../../../lib/mongoconnect';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import {
  computeCategoryOverall,
  computeFeedbackOverall,
} from '../../../../lib/vendorFeedbackRatingConfig';

const COLLECTION = 'vendor_material_feedback';

function normalizeRatings(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const out = {};
  for (let i = 1; i <= 10; i++) {
    const v = obj[i];
    if (v == null || v === '') continue;
    const n = Math.min(5, Math.max(1, parseInt(Number(v), 10) || 0));
    if (n >= 1 && n <= 5) out[i] = n;
  }
  return Object.keys(out).length ? out : null;
}

function getFeedbackOverall(f) {
  const mat = computeCategoryOverall(f.ratingMaterials || null);
  const srv = computeCategoryOverall(f.ratingServices || null);
  const overall = computeFeedbackOverall(mat, srv);
  if (overall != null) return overall;
  return f.starRating != null ? Number(f.starRating) : null;
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method } = req;

  try {
    const { db } = await connectToDatabase();

    switch (method) {
      case 'GET': {
        const { vendorCode } = req.query;
        if (!vendorCode || !vendorCode.trim()) {
          return res.status(400).json({ error: 'Vendor code is required' });
        }
        const code = String(vendorCode).trim();
        const feedbacks = await db
          .collection(COLLECTION)
          .find({ vendorCode: code })
          .sort({ createdAt: -1 })
          .toArray();

        const total = feedbacks.length;
        const overalls = feedbacks.map((f) => getFeedbackOverall(f)).filter((v) => v != null);
        const sumStars = overalls.reduce((acc, v) => acc + v, 0);
        const averageRating = overalls.length > 0 ? Math.round((sumStars / overalls.length) * 10) / 10 : 0;

        const tierVotes = { top: 0, middle: 0, lower: 0 };
        feedbacks.forEach((f) => {
          const t = (f.tier || '').toLowerCase();
          if (t === 'top tier' || t === 'toptier') tierVotes.top += 1;
          else if (t === 'middle tier' || t === 'middletier') tierVotes.middle += 1;
          else if (t === 'lower tier' || t === 'lowertier') tierVotes.lower += 1;
        });

        return res.status(200).json({
          feedbacks,
          averageRating,
          totalRatings: total,
          tierVotes,
        });
      }

      case 'POST': {
        const { vendorCode, vendorName, tier, starRating, comment, ratingMaterials, ratingServices } = req.body || {};
        if (!vendorCode || !String(vendorCode).trim()) {
          return res.status(400).json({ error: 'Vendor code is required' });
        }
        const allowedTiers = ['top tier', 'middle tier', 'lower tier'];
        const tierLower = String(tier || '').trim().toLowerCase();
        const tierNorm = allowedTiers.includes(tierLower) ? tierLower : null;
        const matNorm = normalizeRatings(ratingMaterials);
        const srvNorm = normalizeRatings(ratingServices);
        const matOverall = computeCategoryOverall(matNorm || {});
        const srvOverall = computeCategoryOverall(srvNorm || {});
        const computedStarRating = computeFeedbackOverall(matOverall, srvOverall);
        const legacyStar = starRating != null ? Math.min(5, Math.max(1, parseInt(Number(starRating), 10) || 0)) || null : null;
        const starRatingToStore = computedStarRating ?? legacyStar ?? null;

        const doc = {
          vendorCode: String(vendorCode).trim(),
          vendorName: String(vendorName || '').trim(),
          tier: tierNorm,
          starRating: starRatingToStore,
          ratingMaterials: matNorm || undefined,
          ratingServices: srvNorm || undefined,
          comment: String(comment || '').trim(),
          userId: session.user?.email || session.user?.id || 'anonymous',
          username: session.user?.name || session.user?.email || 'Unknown',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await db.collection(COLLECTION).insertOne(doc);
        return res.status(201).json({ _id: result.insertedId, ...doc });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Vendor material feedback API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
