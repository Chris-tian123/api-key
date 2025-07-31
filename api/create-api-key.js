import { randomBytes } from 'crypto';
import mongoose from 'mongoose';

const mongoUri = process.env.MONGODB_URI;

const apiKeySchema = new mongoose.Schema({
  key: String,
  createdAt: { type: Date, default: Date.now }
});
const ApiKey = mongoose.models.ApiKey || mongoose.model('ApiKey', apiKeySchema);

async function connect() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    await connect();

    const key = randomBytes(16).toString('hex');
    const newKey = await ApiKey.create({ key });

    return res.status(200).json({ key: newKey.key });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
