import express from 'express';
import Key from '../models/Key.js';
import checkPassword from '../utils/checkPassword.js';

const banRoutes = express.Router();

/**
 * POST /bankey
 * Body: { key: string }
 * Requires admin password via checkPassword()
 */
banRoutes.post('/bankey', async (req, res) => {
  if (!checkPassword(req, res)) return;

  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'Missing API key in request body' });

  try {
    const found = await Key.findOne({ key });
    if (!found) return res.status(404).json({ error: 'Key not found' });

    if (found.banned) return res.status(409).json({ error: 'Key is already banned' });

    found.banned = true;
    await found.save();

    console.log(`[Key Banned] ${key}`);
    res.json({ success: true, message: 'API key has been banned' });
  } catch (err) {
    console.error('[Ban Key Error]', err);
    res.status(500).json({ error: 'Failed to ban API key' });
  }
});

export default banRoutes;
