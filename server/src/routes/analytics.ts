import express from 'express';
import { get, all } from '../database.js';

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Total jobs
    const totalJobs = await get<{ count: number }>('SELECT COUNT(*) as count FROM jobs');
    
    // Open jobs
    const openJobs = await get<{ count: number }>('SELECT COUNT(*) as count FROM jobs WHERE status = ?', ['open']);
    
    // Total applicants
    const totalApplicants = await get<{ count: number }>('SELECT COUNT(*) as count FROM applicants');
    
    // Applicants by stage
    const applicantsByStage = await all<{ stage: string; count: number }>(
      `SELECT stage, COUNT(*) as count 
       FROM applicants 
       GROUP BY stage`
    );
    
    // Applicants by job
    const applicantsByJob = await all<{ job_id: string; job_title: string; count: number }>(
      `SELECT j.id as job_id, j.title as job_title, COUNT(a.id) as count
       FROM jobs j
       LEFT JOIN applicants a ON j.id = a.job_id
       GROUP BY j.id, j.title
       ORDER BY count DESC
       LIMIT 10`
    );
    
    // Recent applicants (last 30 days)
    const recentApplicants = await get<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM applicants 
       WHERE DATE(applied_at) >= DATE('now', '-30 days')`
    );
    
    // Scheduled interviews
    const scheduledInterviews = await get<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM interviews 
       WHERE status = 'scheduled' AND scheduled_at >= datetime('now')`
    );

    res.json({
      totalJobs: totalJobs?.count || 0,
      openJobs: openJobs?.count || 0,
      totalApplicants: totalApplicants?.count || 0,
      recentApplicants: recentApplicants?.count || 0,
      scheduledInterviews: scheduledInterviews?.count || 0,
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
    const { days = 30 } = req.query;
    const data = await all<{ date: string; count: number }>(
      `SELECT DATE(applied_at) as date, COUNT(*) as count
       FROM applicants
       WHERE DATE(applied_at) >= DATE('now', ? || ' days')
       GROUP BY DATE(applied_at)
       ORDER BY date ASC`,
      [`-${days}`]
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
    
    const totalApplicants = await get<{ count: number }>(
      'SELECT COUNT(*) as count FROM applicants WHERE job_id = ?',
      [jobId]
    );
    
    const applicantsByStage = await all<{ stage: string; count: number }>(
      `SELECT stage, COUNT(*) as count 
       FROM applicants 
       WHERE job_id = ?
       GROUP BY stage`,
      [jobId]
    );
    
    const interviews = await get<{ count: number }>(
      'SELECT COUNT(*) as count FROM interviews WHERE job_id = ?',
      [jobId]
    );

    res.json({
      totalApplicants: totalApplicants?.count || 0,
      applicantsByStage,
      totalInterviews: interviews?.count || 0,
    });
  } catch (error) {
    console.error('Error fetching job statistics:', error);
    res.status(500).json({ error: 'Failed to fetch job statistics' });
  }
});

export { router as analyticsRoutes };

