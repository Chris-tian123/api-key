import express from 'express';
import Key from '../models/Key.js';
import checkPassword from '../utils/checkPassword.js';

const listRoutes = express.Router();

/**
 * GET /listkeys
 * Requires admin password via checkPassword()
 * Returns all API keys with sensitive fields omitted
 */
listRoutes.get('/listkeys', async (req, res) => {
  if (!checkPassword(req, res)) return;

  try {
    const keys = await Key.find().select('-__v -logs -_id');
    res.json({ success: true, total: keys.length, keys });
  } catch (err) {
    console.error('[List Keys Error]', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve keys' });
  }
});

export default listRoutes;
