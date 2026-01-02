import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import { jobRoutes } from './routes/jobs.js';
import { applicantRoutes } from './routes/applicants.js';
import { interviewRoutes } from './routes/interviews.js';
import { emailRoutes } from './routes/emails.js';
import { analyticsRoutes } from './routes/analytics.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
initDatabase().then(() => {
  console.log('Database initialized');

  // Routes
  app.use('/api/jobs', jobRoutes);
  app.use('/api/applicants', applicantRoutes);
  app.use('/api/interviews', interviewRoutes);
  app.use('/api/emails', emailRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

