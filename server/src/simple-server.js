import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mock data
let jobs = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    description: 'We are looking for a senior frontend developer...',
    requirements: '5+ years of experience with React',
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Backend Engineer',
    department: 'Engineering',
    location: 'New York',
    type: 'Full-time',
    description: 'Join our backend team...',
    requirements: 'Experience with Node.js and databases',
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let applicants = [
  {
    id: '1',
    job_id: '1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '555-1234',
    resume_url: '',
    cover_letter: 'Experienced developer...',
    stage: 'applied',
    status: 'active',
    applied_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Jobs routes
app.get('/api/jobs', (req, res) => {
  const { status } = req.query;
  let filteredJobs = jobs;
  if (status) {
    filteredJobs = jobs.filter(job => job.status === status);
  }
  res.json(filteredJobs);
});

app.get('/api/jobs/:id', (req, res) => {
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

app.post('/api/jobs', (req, res) => {
  const newJob = {
    id: Date.now().toString(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  jobs.push(newJob);
  res.status(201).json(newJob);
});

app.put('/api/jobs/:id', (req, res) => {
  const index = jobs.findIndex(j => j.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Job not found' });
  }
  jobs[index] = { ...jobs[index], ...req.body, updated_at: new Date().toISOString() };
  res.json(jobs[index]);
});

app.delete('/api/jobs/:id', (req, res) => {
  const index = jobs.findIndex(j => j.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Job not found' });
  }
  jobs.splice(index, 1);
  res.status(204).send();
});

// Applicants routes
app.get('/api/applicants', (req, res) => {
  const { job_id, stage, status } = req.query;
  let filteredApplicants = applicants;
  
  if (job_id) filteredApplicants = filteredApplicants.filter(a => a.job_id === job_id);
  if (stage) filteredApplicants = filteredApplicants.filter(a => a.stage === stage);
  if (status) filteredApplicants = filteredApplicants.filter(a => a.status === status);
  
  res.json(filteredApplicants);
});

app.get('/api/applicants/:id', (req, res) => {
  const applicant = applicants.find(a => a.id === req.params.id);
  if (!applicant) {
    return res.status(404).json({ error: 'Applicant not found' });
  }
  res.json(applicant);
});

app.post('/api/applicants', (req, res) => {
  const newApplicant = {
    id: Date.now().toString(),
    ...req.body,
    applied_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  applicants.push(newApplicant);
  res.status(201).json(newApplicant);
});

app.put('/api/applicants/:id', (req, res) => {
  const index = applicants.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Applicant not found' });
  }
  applicants[index] = { ...applicants[index], ...req.body, updated_at: new Date().toISOString() };
  res.json(applicants[index]);
});

app.post('/api/applicants/bulk-update-stage', (req, res) => {
  const { applicant_ids, stage } = req.body;
  applicant_ids.forEach(id => {
    const index = applicants.findIndex(a => a.id === id);
    if (index !== -1) {
      applicants[index].stage = stage;
      applicants[index].updated_at = new Date().toISOString();
    }
  });
  res.json({ message: 'Applicants updated successfully' });
});

// Interviews routes (mock)
app.get('/api/interviews', (req, res) => {
  res.json([]);
});

app.post('/api/interviews', (req, res) => {
  const newInterview = {
    id: Date.now().toString(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  res.status(201).json(newInterview);
});

// Email routes (mock)
app.post('/api/emails/bulk-acceptance', (req, res) => {
  console.log('Sending acceptance emails:', req.body);
  res.json({ message: 'Acceptance emails sent successfully' });
});

app.post('/api/emails/bulk-rejection', (req, res) => {
  console.log('Sending rejection emails:', req.body);
  res.json({ message: 'Rejection emails sent successfully' });
});

// Analytics routes
app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    totalJobs: jobs.length,
    totalApplicants: applicants.length,
    activeJobs: jobs.filter(j => j.status === 'open').length,
    applicantsByStage: [
      { stage: 'applied', count: applicants.filter(a => a.stage === 'applied').length },
      { stage: 'shortlisted', count: applicants.filter(a => a.stage === 'shortlisted').length },
      { stage: 'recommended', count: applicants.filter(a => a.stage === 'recommended').length },
      { stage: 'hired', count: applicants.filter(a => a.stage === 'hired').length }
    ]
  });
});

app.get('/api/analytics/applicants-by-stage', (req, res) => {
  const stages = ['applied', 'shortlisted', 'recommended', 'hired', 'declined', 'withdrawn'];
  const data = stages.map(stage => ({
    stage,
    count: applicants.filter(a => a.stage === stage).length
  }));
  res.json(data);
});

app.get('/api/analytics/applicants-over-time', (req, res) => {
  res.json([]);
});

app.get('/api/analytics/job-stats/:jobId', (req, res) => {
  const jobApplicants = applicants.filter(a => a.job_id === req.params.jobId);
  res.json({
    totalApplicants: jobApplicants.length,
    applicantsByStage: [
      { stage: 'applied', count: jobApplicants.filter(a => a.stage === 'applied').length },
      { stage: 'shortlisted', count: jobApplicants.filter(a => a.stage === 'shortlisted').length },
      { stage: 'recommended', count: jobApplicants.filter(a => a.stage === 'recommended').length },
      { stage: 'hired', count: jobApplicants.filter(a => a.stage === 'hired').length }
    ]
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Mock data loaded - using in-memory storage');
});
