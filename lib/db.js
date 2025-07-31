// === /lib/db.js ===
import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://stuntmanxbunny:bunny@asiaartsdb1.hp6gt.mongodb.net/?retryWrites=true&w=majority&appName=AsiaArtsDB1
"

if (!MONGODB_URI) throw new Error('MongoDB URI not found in env');

let cached = global.mongoose;

if (!cached) cached = global.mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then(m => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
