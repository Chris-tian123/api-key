import express from 'express';
import Key from '../models/key.js';

const statsRoutes = express.Router();

statsRoutes.get('/stats', async (req, res) => {
  const key = req.query.key || req.headers['x-api-key'];
  if (!key) {
    return res.status(400).json({ error: 'Missing API key' });
  }

  try {
    const found = await Key.findOne({ key });
    if (!found) {
      return res.status(403).json({ error: 'API key not found' });
    }
    if (found.banned) {
      return res.status(403).json({ error: 'Banned API key' });
    }
    if (found.revoked) {
      return res.status(403).json({ error: 'Revoked API key' });
    }

    const [total, used, revoked, banned, temporary, unused] = await Promise.all([
      Key.countDocuments(),
      Key.countDocuments({ usageCount: { $gt: 0 } }),
      Key.countDocuments({ revoked: true }),
      Key.countDocuments({ banned: true }),
      Key.countDocuments({ temporary: true }),
      Key.countDocuments({ usageCount: { $eq: 0 } }),
    ]);

    res.json({
      total,
      used,
      unused,
      revoked,
      banned,
      temporary,
    });
  } catch (err) {
    console.error('[Stats Error]', err);
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

export default statsRoutes;
