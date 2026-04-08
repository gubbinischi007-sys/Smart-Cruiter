import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Parallel fetch for dashboard data using Supabase native methods
    const [
      jobsRes,
      applicantsRes,
      recentApplicantsRes,
      interviewsListRes,
      interviewsCountRes,
    ] = await Promise.all([
      // 1. Get all jobs for counts and graph
      supabase.from('jobs')
        .select('id, title, status, applicants(id)')
        .eq('company_id', companyId),
      
      // 2. Get total applicants by stage
      supabase.from('applicants')
        .select('id, stage, applied_at')
        .in('job_id', await (async () => {
          const { data } = await supabase.from('jobs').select('id').eq('company_id', companyId);
          return data?.map(j => j.id) || [];
        })()),

      // 3. Recent applications (with job titles)
      supabase.from('applicants')
        .select('*, jobs(title)')
        .in('job_id', await (async () => {
          const { data } = await supabase.from('jobs').select('id').eq('company_id', companyId);
          return data?.map(j => j.id) || [];
        })())
        .order('applied_at', { ascending: false })
        .limit(5),

      // 4. Upcoming interviews (List)
      supabase.from('interviews')
        .select(`
          *,
          applicants (first_name, last_name),
          jobs (title)
        `)
        .gte('scheduled_at', new Date().toISOString())
        .eq('status', 'scheduled')
        .in('job_id', await (async () => {
          const { data } = await supabase.from('jobs').select('id').eq('company_id', companyId);
          return data?.map(j => j.id) || [];
        })())
        .order('scheduled_at', { ascending: true })
        .limit(5),

      // 5. Scheduled Interviews Total (Count)
      supabase.from('interviews')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_at', new Date().toISOString())
        .eq('status', 'scheduled')
        .in('job_id', await (async () => {
          const { data } = await supabase.from('jobs').select('id').eq('company_id', companyId);
          return data?.map(j => j.id) || [];
        })())
    ]);

    const jobs = jobsRes.data || [];
    const applicants = applicantsRes.data || [];
    const recentApplications = recentApplicantsRes.data?.map(app => ({
      ...app,
      job_title: app.jobs?.title
    })) || [];
    
    const upcomingInterviews = interviewsListRes.data?.map(int => ({
      ...int,
      applicant_name: int.applicants ? `${int.applicants.first_name} ${int.applicants.last_name}` : 'Unknown Candidate',
      job_title: int.jobs?.title
    })) || [];

    // Aggregates
    const totalJobs = jobs.length;
    const openJobs = jobs.filter(j => j.status === 'open').length;
    const totalApplicants = applicants.length;

    // Applicants by stage
    const stages = ['applied', 'shortlisted', 'recommended', 'hired', 'declined', 'withdrawn'];
    const applicantsByStage = stages.map(stage => ({
      stage,
      count: applicants.filter(a => a.stage === stage).length
    }));

    // Applicants by job (for the graph)
    const applicantsByJob = jobs.map(j => ({
      job_id: j.id,
      job_title: j.title,
      count: j.applicants ? j.applicants.length : 0
    })).sort((a, b) => b.count - a.count).slice(0, 10);

    // Recent applicants (30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentApplicantsTotal = applicants.filter(a => new Date(a.applied_at) >= thirtyDaysAgo).length;

    const scheduledInterviewsTotal = interviewsCountRes.count || 0;

    res.json({
      totalJobs,
      openJobs,
      totalApplicants,
      recentApplicants: recentApplicantsTotal,
      scheduledInterviews: scheduledInterviewsTotal,
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
    if (!companyId) return res.status(400).json({ error: 'Company ID required' });

    // Nested subquery via .in() because of simplified RLS/schema
    const { data: jobIds } = await supabase.from('jobs').select('id').eq('company_id', companyId);
    const ids = jobIds?.map(j => j.id) || [];

    const { data: applicants } = await supabase
      .from('applicants')
      .select('stage')
      .in('job_id', ids);

    const stages = ['applied', 'shortlisted', 'recommended', 'hired', 'declined', 'withdrawn'];
    const result = stages.map(stage => ({
      stage,
      count: applicants?.filter(a => a.stage === stage).length || 0
    }));

    res.json(result);
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
    if (!companyId) return res.status(400).json({ error: 'Company ID required' });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);

    const { data: jobIds } = await supabase.from('jobs').select('id').eq('company_id', companyId);
    const ids = jobIds?.map(j => j.id) || [];

    const { data: applicants } = await supabase
      .from('applicants')
      .select('applied_at')
      .in('job_id', ids)
      .gte('applied_at', thirtyDaysAgo.toISOString())
      .order('applied_at', { ascending: true });

    // Group by date in JS
    const grouped = applicants?.reduce((acc: any, curr) => {
      const date = new Date(curr.applied_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const result = Object.entries(grouped || {}).map(([date, count]) => ({ date, count }));
    res.json(result);
  } catch (error) {
    console.error('Error fetching applicants over time:', error);
    res.status(500).json({ error: 'Failed to fetch applicants over time' });
  }
});

// Get job statistics
router.get('/job-stats/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const [applicantsRes, interviewsRes] = await Promise.all([
      supabase.from('applicants').select('stage').eq('job_id', jobId),
      supabase.from('interviews').select('id', { count: 'exact', head: true }).eq('job_id', jobId)
    ]);

    const applicants = applicantsRes.data || [];
    const totalApplicants = applicants.length;
    
    const stages = ['applied', 'shortlisted', 'recommended', 'hired', 'declined', 'withdrawn'];
    const applicantsByStage = stages.map(stage => ({
      stage,
      count: applicants.filter(a => a.stage === stage).length
    }));

    res.json({
      totalApplicants,
      applicantsByStage,
      totalInterviews: interviewsRes.count || 0,
    });
  } catch (error) {
    console.error('Error fetching job statistics:', error);
    res.status(500).json({ error: 'Failed to fetch job statistics' });
  }
});

export { router as analyticsRoutes };
