import { connectDB } from '../../lib/db';
import Key from '../../models/Key';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Only GET allowed' });
  if (req.headers['x-admin-token'] !== process.env.ADMIN_TOKEN) return res.status(403).json({ error: 'Forbidden' });

  await connectDB();
  const keys = await Key.find({});
  res.json({ success: true, keys });
}
