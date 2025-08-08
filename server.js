import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import createRoutes from './routes/create.js';
import verifyRoutes from './routes/verify.js';
import revokeRoutes from './routes/revoke.js';
import banRoutes from './routes/ban.js';
import listRoutes from './routes/list.js';
import statsRoutes from './routes/stats.js';
import logsRoutes from './routes/logs.js';

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();
app.use(express.json());
app.set('trust proxy', 1);
mongoose.connect(process.env.MONGODB_URI, {}).then(() => {
  console.log('MongoDB connected');
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.use('/api', createRoutes);
app.use('/api', verifyRoutes);
app.use('/api', revokeRoutes);
app.use('/api', banRoutes);
app.use('/api', listRoutes);
app.use('/api', statsRoutes);
app.use('/api', logsRoutes);

app.get('/', (req, res) => {
  res.send('API Key Server is running.');
});

export default app;
