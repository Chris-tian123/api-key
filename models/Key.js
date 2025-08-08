import mongoose from 'mongoose';

const usageSchema = new mongoose.Schema({
  endpoint: String,
  ip: String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const logSchema = new mongoose.Schema({
  status: String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const keySchema = new mongoose.Schema({
  key: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date,
  temporary: { type: Boolean, default: false },
  revoked: { type: Boolean, default: false },
  banned: { type: Boolean, default: false },
  used: { type: Boolean, default: false },
  logs: [logSchema],
  usage: [usageSchema]
});

export default mongoose.model('Key', keySchema);
