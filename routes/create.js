import express from 'express';
import crypto from 'crypto';
import Key from '../models/Key.js';
import checkPassword from '../utils/checkPassword.js';

const createRoutes = express.Router();

createRoutes.post('/new', async (req, res) => {
  if (!checkPassword(req, res)) return;

  const { temporary = false, expiresIn } = req.body;

  if (temporary && (!expiresIn || isNaN(expiresIn))) {
    return res.status(400).json({ error: 'Temporary key must have valid expiresIn (in seconds).' });
  }

  try {
    const newKey = `trenny.${crypto.randomBytes(16).toString('hex')}`;

    const keyDoc = new Key({
      key: newKey,
      temporary,
      expiresAt: temporary ? new Date(Date.now() + expiresIn * 1000) : null
    });

    await keyDoc.save();
    console.log(`[Key Created] ${newKey} (temp=${temporary}, expiresIn=${expiresIn || '∞'})`);

    res.json({ success: true, key: newKey });
  } catch (err) {
    console.error('[Create Key Error]', err);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

export default createRoutes;
