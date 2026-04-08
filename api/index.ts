import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import multer from 'multer';
import pdf from 'pdf-parse';

dotenv.config();

// ── Supabase ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eluarxdyxvxwknylejaj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsdWFyeGR5eHZ4d2tueWxlamFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg5ODU5NiwiZXhwIjoyMDg3NDc0NTk2fQ.7RK3EqTtOlOrS4KNqttdmFb6mhuDp99bAKyKywphFXE';
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const upload = multer({ storage: multer.memoryStorage() });

// ── Email ─────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

async function sendEmail(opts: { to: string; subject: string; html: string }) {
    try {
        await sb.from('notifications').insert({
            id: uuidv4(),
            recipient_email: opts.to,
            subject: opts.subject,
            message: opts.html,
            type: 'email',
            is_read: 0,
            created_at: new Date().toISOString()
        });
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail({ from: process.env.EMAIL_USER, ...opts });
        }
    } catch (e) { console.error('Email error:', e); }
}

async function sendBulkEmails(recipients: any[], type: string, getOpts: (r: any) => { subject: string, html: string }) {
    let successful = 0;
    for (const r of recipients) {
        if (!r.email) continue;
        const opts = getOpts(r);
        try {
            await sendEmail({ to: r.email, ...opts });
            successful++;
        } catch (e) { console.error(e); }
    }
    return { successful, count: recipients.length };
}

// ── Express ───────────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
const api = express.Router();

api.get('/health', (_req: any, res: any) => res.json({ status: 'ok', db: 'supabase' }));

// JOBS
api.get('/jobs', async (req: any, res: any) => {
    try {
        const companyId = req.headers['x-company-id'];
        let q = sb.from('jobs').select('*').order('created_at', { ascending: false });
        if (req.query.status) q = q.eq('status', req.query.status);
        if (companyId) q = q.eq('company_id', companyId);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        res.json(data || []);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.get('/jobs/:id', async (req: any, res: any) => {
    try {
        const { data, error } = await sb.from('jobs').select('*').eq('id', req.params.id).single();
        if (error) throw new Error(error.message);
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/jobs', async (req: any, res: any) => {
    try {
        const companyId = req.headers['x-company-id'];
        if (!companyId) return res.status(400).json({ error: 'Company ID is missing.' });
        const { title, department, location, type, description, requirements, status } = req.body;
        if (!title) return res.status(400).json({ error: 'Job title is required.' });

        const { data: comp } = await sb.from('companies').select('status').eq('id', companyId).single();
        // AUTO-APPROVE FOR DEV TESTING
        if (!comp || comp.status !== 'approved') {
            await sb.from('companies').update({ status: 'approved' }).eq('id', companyId);
        }

        const now = new Date().toISOString();
        const { data, error } = await sb.from('jobs').insert({
            id: uuidv4(), title, department: department || null, location: location || null,
            type: type || null, description: description || null, requirements: requirements || null,
            status: status || 'open', company_id: companyId, created_at: now, updated_at: now
        }).select().single();

        if (error) throw new Error(error.message);
        res.status(201).json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// APPLICANTS
api.get('/applicants', async (req: any, res: any) => {
    try {
        const { job_id, stage, status, email } = req.query;
        const companyId = req.headers['x-company-id'];
        let q = sb.from('applicants').select('*, jobs!inner(company_id)').order('applied_at', { ascending: false });
        if (email) q = q.eq('email', email);
        if (job_id) q = q.eq('job_id', job_id);
        if (stage) q = q.eq('stage', stage);
        if (status) q = q.eq('status', status);
        if (companyId) q = q.eq('jobs.company_id', companyId);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        const { data: jobs } = await sb.from('jobs').select('id, title');
        const jobsMap = Object.fromEntries((jobs || []).map((j: any) => [j.id, j.title]));
        res.json((data || []).map((a: any) => ({ ...a, job_title: jobsMap[a.job_id] || 'N/A' })));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/applicants', upload.single('resume'), async (req: any, res: any) => {
    try {
        const { job_id, first_name, last_name, email, phone, resume_url, cover_letter } = req.body;
        if (!job_id || !first_name || !last_name || !email) return res.status(400).json({ error: 'Missing required fields' });
        let pt = '';
        if (req.file) { try { const p = await pdf(req.file.buffer); pt = p.text || ''; } catch (err) { } }
        const { data: job } = await sb.from('jobs').select('*').eq('id', job_id).single();
        if (!job || job.status !== 'open') return res.status(400).json({ error: 'Job not found or closed.' });
        const id = uuidv4();
        const { data, error } = await sb.from('applicants').insert({
            id, job_id, first_name, last_name, email, phone, resume_url, cover_letter, resume_text: pt,
            stage: 'applied', status: 'active', applied_at: new Date().toISOString(), updated_at: new Date().toISOString()
        }).select().single();
        if (error) throw new Error(error.message);
        res.status(201).json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ANALYTICS
api.get('/analytics/dashboard', async (req: any, res: any) => {
    try {
        const companyId = req.headers['x-company-id'];
        if (!companyId) return res.status(400).json({ error: 'Company ID required' });
        const { data: jobs } = await sb.from('jobs').select('*').eq('company_id', companyId);
        const jobIds = (jobs || []).map(j => j.id);
        const { data: applicants } = jobIds.length > 0 ? await sb.from('applicants').select('*').in('job_id', jobIds) : { data: [] };
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        res.json({
            totalJobs: (jobs || []).length,
            openJobs: (jobs || []).filter(j => j.status === 'open').length,
            totalApplicants: (applicants || []).length,
            recentApplicants: (applicants || []).filter(a => new Date(a.applied_at) > thirtyDaysAgo).length,
            scheduledInterviews: 0,
            applicantsByStage: [
                { stage: 'applied', count: (applicants || []).filter(a => a.stage === 'applied').length },
                { stage: 'shortlisted', count: (applicants || []).filter(a => a.stage === 'shortlisted').length },
                { stage: 'interview', count: (applicants || []).filter(a => a.stage === 'interview').length },
                { stage: 'hired', count: (applicants || []).filter(a => a.stage === 'hired').length },
                { stage: 'rejected', count: (applicants || []).filter(a => a.stage === 'rejected').length },
            ],
            applicantsByJob: (jobs || []).map(j => ({ job_id: j.id, job_title: j.title, count: (applicants || []).filter(a => a.job_id === j.id).length })).sort((a, b) => b.count - a.count).slice(0, 5)
        });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.get('/interviews', async (req: any, res: any) => res.json([]));

// PLATFORM STATUS
api.get('/platform/status', async (req: any, res: any) => {
    try {
        const { email } = req.query;
        let { data } = await sb.from('companies').select('*').eq('email', email).maybeSingle();
        // AUTO-APPROVE IF NONE
        if (data && data.status === 'none') {
            const { data: updated } = await sb.from('companies').update({ status: 'approved' }).eq('id', data.id).select().single();
            data = updated;
        }
        res.json(data || { status: 'none' });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// HR TEAM
api.get('/hr-team', async (req: any, res: any) => {
    try {
        const companyId = req.headers['x-company-id'];
        const { data: hr } = await sb.from('hr_team').select('*').eq('company_id', companyId);
        const { data: inv } = await sb.from('hr_invitations').select('*').eq('company_id', companyId).eq('status', 'pending');
        res.json([...(hr || []), ...(inv || []).map(i => ({ id: i.id, name: 'Invited Member', email: i.email, status: 'Pending' }))]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.use('/api', api);
app.use('/', api);
export default app;
