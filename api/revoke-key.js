import { connectDB } from '../../lib/db';
import Key from '../../models/Key';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
  if (req.headers['x-admin-token'] !== process.env.ADMIN_TOKEN) return res.status(403).json({ error: 'Forbidden' });

  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'Missing key' });

  await connectDB();
  const updated = await Key.findOneAndUpdate({ key }, { revoked: true });

  if (!updated) return res.status(404).json({ error: 'Key not found' });
  res.json({ success: true, message: 'Key revoked' });
}
