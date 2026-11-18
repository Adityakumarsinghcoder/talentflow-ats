import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { seedRealDB } from './config/seed.js';
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import resumeRoutes from './routes/resumes.js';
import applicationRoutes from './routes/applications.js';
import interviewRoutes from './routes/interviews.js';
import analyticsRoutes from './routes/analytics.js';
import messageRoutes from './routes/messages.js';

// Connect to MongoDB
await connectDB();
if (process.env.USE_MOCK_DB !== 'true' && process.env.SEED_DATABASE === 'true') {
  await seedRealDB();
}

const app = express();

// Middleware
app.use(cors({
  origin: true, // Dynamically allow and reflect requesting origin for cross-origin credentials compatibility
  credentials: true
}));
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url} - Body: ${JSON.stringify({ ...req.body, password: req.body.password ? '***' : undefined })}`);
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('public/uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/messages', messageRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'TalentFlow ATS API is running...' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'An internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
