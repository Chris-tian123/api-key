import mongoose from 'mongoose';

const keySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  revoked: { type: Boolean, default: false },
  ip: String
});

export default mongoose.models.Key || mongoose.model('Key', keySchema);
