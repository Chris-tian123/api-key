import express from 'express';
import Key from '../models/Key.js';

const logsRoutes = express.Router();

logsRoutes.get('/logs', async (req, res) => {
  const { key } = req.query;
  console.log('[GET /logs] key:', key);

  if (!key) {
    return res.status(400).json({ error: 'Missing key parameter' });
  }

  try {
    const found = await Key.findOne({ key });
    if (!found) {
      return res.status(403).json({ error: 'API key not found' });
    }
    if (found.banned) {
      return res.status(403).json({ error: 'Banned API key' });
    }

    const logs = (found.logs || []).slice(-100).reverse();
    res.json(logs);
  } catch (err) {
    console.error('[Logs GET Error]', err);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});


export default logsRoutes;
