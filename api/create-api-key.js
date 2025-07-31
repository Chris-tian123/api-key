import { connectDB } from '../../lib/db';
import Key from '../../models/Key';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
  if (req.headers['x-admin-token'] !== "trelloxbunny") return res.status(403).json({ error: 'Forbidden' });

  await connectDB();

  const newKey = crypto.randomBytes(24).toString('hex');
  await Key.create({ key: newKey, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress });

  res.json({ success: true, key: newKey });
}

