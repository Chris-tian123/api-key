import express from 'express';
import Key from '../models/Key.js';

const verifyRoutes = express.Router();

verifyRoutes.get('/verify', async (req, res) => {
  const { key, endpoint } = req.query;
  if (!key) return res.status(400).json({ valid: false, error: 'Missing key' });

  const found = await Key.findOne({ key });
  if (!found || found.revoked || found.banned) {
    return res.json({ valid: false });
  }

  // Check expiration for temporary keys
  if (found.temporary && found.expiresAt && found.expiresAt.getTime() < Date.now()) {
    found.revoked = true;
    await found.save();
    return res.json({ valid: false });
  }

  // Update usage count & log with IP and endpoint
  found.usageCount = (found.usageCount || 0) + 1;
  if (!Array.isArray(found.logs)) found.logs = [];
  found.logs.push({
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    endpoint: endpoint || 'unknown',
    timestamp: new Date().toISOString()
  });

  await found.save();

  res.json({ valid: true });
});

export default verifyRoutes;
