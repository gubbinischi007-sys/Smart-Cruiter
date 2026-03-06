import express from 'express';
import { get, all } from '../database.js';

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalJobs,
      openJobs,
      totalApplicants,
      applicantsByStage,
      applicantsByJob,
      recentApplicants,
      scheduledInterviews
    ] = await Promise.all([
      get<{ count: string }>('SELECT COUNT(*) as count FROM jobs'),
      get<{ count: string }>('SELECT COUNT(*) as count FROM jobs WHERE status = ?', ['open']),
      get<{ count: string }>('SELECT COUNT(*) as count FROM applicants'),
      all<{ stage: string; count: number }>(`SELECT stage, COUNT(*) as count FROM applicants GROUP BY stage`),
      all<{ job_id: string; job_title: string; count: number }>(
        `SELECT j.id as job_id, j.title as job_title, COUNT(a.id) as count
         FROM jobs j
         LEFT JOIN applicants a ON j.id = a.job_id
         GROUP BY j.id, j.title
         ORDER BY count DESC
         LIMIT 10`
      ),
      get<{ count: string }>(`SELECT COUNT(*) as count FROM applicants WHERE applied_at >= datetime('now', '-30 days')`),
      get<{ count: string }>(`SELECT COUNT(*) as count FROM interviews WHERE status = 'scheduled' AND scheduled_at >= datetime('now')`)
    ]);

    res.json({
      totalJobs: parseInt(totalJobs?.count || '0'),
      openJobs: parseInt(openJobs?.count || '0'),
      totalApplicants: parseInt(totalApplicants?.count || '0'),
      recentApplicants: parseInt(recentApplicants?.count || '0'),
      scheduledInterviews: parseInt(scheduledInterviews?.count || '0'),
      applicantsByStage,
      applicantsByJob,
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// Get applicants by stage (for charts)
router.get('/applicants-by-stage', async (req, res) => {
  try {
    const data = await all<{ stage: string; count: number }>(
      `SELECT stage, COUNT(*) as count
       FROM applicants
       GROUP BY stage
       ORDER BY
         CASE stage
           WHEN 'applied' THEN 1
           WHEN 'shortlisted' THEN 2
           WHEN 'recommended' THEN 3
           WHEN 'hired' THEN 4
           WHEN 'declined' THEN 5
           WHEN 'withdrawn' THEN 6
           ELSE 7
         END`
    );
    res.json(data);
  } catch (error) {
    console.error('Error fetching applicants by stage:', error);
    res.status(500).json({ error: 'Failed to fetch applicants by stage' });
  }
});

// Get applicants over time
router.get('/applicants-over-time', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    // SQLite: cast to date
    const data = await all<{ date: string; count: number }>(
      `SELECT DATE(applied_at) as date, COUNT(*) as count
       FROM applicants
       WHERE applied_at >= date('now', ?)
       GROUP BY DATE(applied_at)
       ORDER BY date ASC`,
      [`-${days} days`]
    );
    res.json(data);
  } catch (error) {
    console.error('Error fetching applicants over time:', error);
    res.status(500).json({ error: 'Failed to fetch applicants over time' });
  }
});

// Get job statistics
router.get('/job-stats/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const [totalApplicants, applicantsByStage, interviews] = await Promise.all([
      get<{ count: string }>('SELECT COUNT(*) as count FROM applicants WHERE job_id = ?', [jobId]),
      all<{ stage: string; count: number }>('SELECT stage, COUNT(*) as count FROM applicants WHERE job_id = ? GROUP BY stage', [jobId]),
      get<{ count: string }>('SELECT COUNT(*) as count FROM interviews WHERE job_id = ?', [jobId])
    ]);

    res.json({
      totalApplicants: parseInt(totalApplicants?.count || '0'),
      applicantsByStage,
      totalInterviews: parseInt(interviews?.count || '0'),
    });
  } catch (error) {
    console.error('Error fetching job statistics:', error);
    res.status(500).json({ error: 'Failed to fetch job statistics' });
  }
});

export { router as analyticsRoutes };
