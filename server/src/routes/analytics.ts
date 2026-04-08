import express from 'express';
import { get, all } from '../database.js';

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    const jobFilter = companyId ? 'WHERE company_id = ?' : '';
    const jobStatusFilter = companyId ? 'WHERE status = ? AND company_id = ?' : 'WHERE status = ?';
    const applicantFilter = companyId ? 'WHERE job_id IN (SELECT id FROM jobs WHERE company_id = ?)' : '';
    const interviewFilter = companyId ? "AND job_id IN (SELECT id FROM jobs WHERE company_id = ?)" : "";
    const applicantTimeFilter = companyId
      ? "WHERE applied_at >= datetime('now', '-30 days') AND job_id IN (SELECT id FROM jobs WHERE company_id = ?)"
      : "WHERE applied_at >= datetime('now', '-30 days')";

    const cIdArr = companyId ? [companyId] : [];
    const statusArr = companyId ? ['open', companyId] : ['open'];

    const results = await Promise.allSettled([
      get<{ count: string }>(`SELECT COUNT(*) as count FROM jobs ${jobFilter}`, cIdArr),
      get<{ count: string }>(`SELECT COUNT(*) as count FROM jobs ${jobStatusFilter}`, statusArr),
      get<{ count: string }>(`SELECT COUNT(*) as count FROM applicants ${applicantFilter}`, cIdArr),
      all<{ stage: string; count: number }>(`SELECT stage, COUNT(*) as count FROM applicants ${applicantFilter} GROUP BY stage`, cIdArr),
      all<{ job_id: string; job_title: string; count: number }>(
        `SELECT j.id as job_id, j.title as job_title, COUNT(a.id) as count
         FROM jobs j
         LEFT JOIN applicants a ON j.id = a.job_id
         ${jobFilter}
         GROUP BY j.id, j.title
         ORDER BY count DESC
         LIMIT 10`,
        cIdArr
      ),
      get<{ count: string }>(`SELECT COUNT(*) as count FROM applicants ${applicantTimeFilter}`, cIdArr),
      get<{ count: string }>(`SELECT COUNT(*) as count FROM interviews WHERE status = 'scheduled' AND scheduled_at >= date('now') ${interviewFilter}`, cIdArr),
      // NEW: Compact lists for dashboard
      all<any>(`SELECT a.*, j.title as job_title FROM applicants a LEFT JOIN jobs j ON a.job_id = j.id ${applicantFilter} ORDER BY a.applied_at DESC LIMIT 5`, cIdArr),
      all<any>(`SELECT i.*, a.first_name || ' ' || a.last_name as applicant_name, j.title as job_title FROM interviews i LEFT JOIN applicants a ON i.applicant_id = a.id LEFT JOIN jobs j ON i.job_id = j.id WHERE i.status = 'scheduled' AND i.scheduled_at >= date('now') ${interviewFilter} ORDER BY i.scheduled_at ASC LIMIT 5`, cIdArr)
    ]);

    // Helper to get result or default
    const val = (index: number, def: any) => results[index].status === 'fulfilled' ? (results[index] as any).value : def;

    const totalJobs = val(0, { count: '0' });
    const openJobs = val(1, { count: '0' });
    const totalApplicants = val(2, { count: '0' });
    const applicantsByStage = val(3, []);
    const applicantsByJob = val(4, []);
    const recentApplicantsTotal = val(5, { count: '0' });
    const scheduledInterviewsTotal = val(6, { count: '0' });
    const recentApplications = val(7, []);
    const upcomingInterviews = val(8, []);

    res.json({
      totalJobs: parseInt(totalJobs?.count || '0'),
      openJobs: parseInt(openJobs?.count || '0'),
      totalApplicants: parseInt(totalApplicants?.count || '0'),
      recentApplicants: parseInt(recentApplicantsTotal?.count || '0'),
      scheduledInterviews: parseInt(scheduledInterviewsTotal?.count || '0'),
      applicantsByStage,
      applicantsByJob,
      recentApplications,
      upcomingInterviews
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// Get applicants by stage (for charts)
router.get('/applicants-by-stage', async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    const applicantFilter = companyId ? 'WHERE job_id IN (SELECT id FROM jobs WHERE company_id = ?)' : '';
    const cIdArr = companyId ? [companyId] : [];

    const data = await all<{ stage: string; count: number }>(
      `SELECT stage, COUNT(*) as count
       FROM applicants
       ${applicantFilter}
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
    const companyId = req.headers['x-company-id'] as string;

    const timeFilter = `applied_at >= date('now', ?)`;
    const companyFilter = companyId ? `AND job_id IN (SELECT id FROM jobs WHERE company_id = ?)` : '';
    const queryParams = companyId ? [`-${days} days`, companyId] : [`-${days} days`];

    // SQLite: cast to date
    const data = await all<{ date: string; count: number }>(
      `SELECT DATE(applied_at) as date, COUNT(*) as count
       FROM applicants
       WHERE ${timeFilter} ${companyFilter}
       GROUP BY DATE(applied_at)
       ORDER BY date ASC`,
      queryParams
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
