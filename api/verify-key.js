import { connectDB } from '../../lib/db';
import Key from '../../models/Key';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Only GET allowed' });

  const { key } = req.query;
  if (!key) return res.status(400).json({ error: 'Missing key' });

  await connectDB();
  const valid = await Key.findOne({ key, revoked: false });

  res.json({ valid: !!valid });
}
