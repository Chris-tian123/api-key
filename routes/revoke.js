import express from 'express';
import Key from '../models/Key.js';
import checkPassword from '../utils/checkPassword.js';

const revokeRoutes = express.Router();

/**
 * POST /revoke
 * Marks an API key as revoked
 */
revokeRoutes.post('/revoke', async (req, res) => {
  if (!checkPassword(req, res)) return;

  const { key } = req.body;

  if (!key) {
    return res.status(400).json({ error: 'Missing API key in request body' });
  }

  try {
    const found = await Key.findOne({ key });

    if (!found) {
      return res.status(404).json({ error: 'API key not found' });
    }

    if (found.revoked) {
      return res.status(400).json({ error: 'API key is already revoked' });
    }

    found.revoked = true;
    await found.save();

    res.json({ success: true, message: 'API key revoked' });
  } catch (err) {
    console.error('[Revoke Error]', err);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

export default revokeRoutes;
