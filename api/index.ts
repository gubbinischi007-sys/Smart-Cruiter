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
        if (!companyId) return res.status(400).json({ error: 'Company ID missing from request headers.' });

        const { title, department, location, type, description, requirements, status } = req.body;
        if (!title) return res.status(400).json({ error: 'Job title is required.' });

        const { data: comp } = await sb.from('companies').select('status').eq('id', companyId).single();
        if (!comp || comp.status !== 'approved') {
            return res.status(403).json({ error: 'Your company profile needs platform admin approval before you can post jobs.' });
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

api.put('/jobs/:id', async (req: any, res: any) => {
    try {
        const updates: any = { updated_at: new Date().toISOString() };
        for (const f of ['title', 'department', 'location', 'type', 'description', 'requirements', 'status'])
            if (req.body[f] !== undefined) updates[f] = req.body[f];
        const { data, error } = await sb.from('jobs').update(updates).eq('id', req.params.id).select().single();
        if (error) throw new Error(error.message);
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/jobs/:id', async (req: any, res: any) => {
    try {
        await sb.from('applicants').delete().eq('job_id', req.params.id);
        const { error } = await sb.from('jobs').delete().eq('id', req.params.id);
        if (error) throw new Error(error.message);
        res.status(204).send();
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

        res.json((data || []).map((a: any) => ({ ...a, job_title: jobsMap[a.job_id] })));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.get('/applicants/:id', async (req: any, res: any) => {
    try {
        const { data, error } = await sb.from('applicants').select('*').eq('id', req.params.id).single();
        if (error) throw new Error(error.message);
        let jobDetails = {};
        if (data.job_id) {
            const { data: job } = await sb.from('jobs').select('title, department, location').eq('id', data.job_id).single();
            if (job) jobDetails = { job_title: job.title, jobs: job };
        }
        res.json({ ...data, ...jobDetails });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/applicants', upload.single('resume'), async (req: any, res: any) => {
    try {
        const { job_id, first_name, last_name, email, phone, resume_url, cover_letter } = req.body;
        if (!job_id || !first_name || !last_name || !email) return res.status(400).json({ error: 'Missing required fields' });

        let actualPdfText = '';
        if (req.file) {
            try {
                const parsed = await pdf(req.file.buffer);
                actualPdfText = parsed.text || '';
            } catch (err) { console.error("PDF parse error:", err); }
        }

        const { data: job } = await sb.from('jobs').select('id, status, title, requirements, description').eq('id', job_id).single();
        if (!job) return res.status(404).json({ error: 'Job not found' });
        if (job.status !== 'open') return res.status(400).json({ error: 'Job is not open' });

        const id = uuidv4();
        const now = new Date().toISOString();
        const { data, error } = await sb.from('applicants').insert({
            id, job_id, first_name, last_name, email,
            phone: phone || null, resume_url: resume_url || null, cover_letter: cover_letter || null,
            resume_text: actualPdfText || null,
            stage: 'applied', status: 'active', applied_at: now, updated_at: now
        }).select().single();

        if (error) throw new Error(error.message);

        // ---- AI SCORING ----
        const resumeUrlLower = (resume_url || '').toLowerCase();
        const nameParts = [(first_name || '').toLowerCase(), (last_name || '').toLowerCase()];
        const isLocalOwner = nameParts.some(part => part.length >= 3 && resumeUrlLower.includes(part));

        let score = 0;
        const jdText = `${job.title} ${job.requirements || job.description || ''}`.toLowerCase().replace(/[^a-z\s]/g, ' ');
        const stopWords = new Set(['the', 'and', 'to', 'of', 'in', 'for', 'with', 'on', 'is', 'as', 'at', 'by', 'an', 'be', 'this', 'that', 'are', 'from', 'or', 'have', 'has', 'will', 'you', 'your', 'we', 'our', 'it', 'can', 'all', 'more', 'their', 'which', 'about', 'what', 'how', 'when', 'where', 'who', 'not', 'but', 'so', 'if', 'then', 'than', 'such', 'into', 'out', 'up', 'down', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'some', 'any', 'both', 'each', 'few', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'too', 'very']);
        const words = jdText.split(/\s+/);
        const keywordCounts: Record<string, number> = {};
        words.forEach(w => { if (w.length > 3 && !stopWords.has(w)) keywordCounts[w] = (keywordCounts[w] || 0) + 1; });
        const jdKeywords = Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);

        const bodyText = actualPdfText.length > 20 ? actualPdfText : (resume_url ? 'university bachelor degree experience intern' : '');
        const applicantText = `${job.title} ${first_name} ${resume_url || ''} ${cover_letter || ''} ${bodyText}`.toLowerCase();
        const missingSkills = jdKeywords.filter(kw => !applicantText.includes(kw));

        if (isLocalOwner || actualPdfText.length > 50) {
            const matchRatio = jdKeywords.length > 0 ? (jdKeywords.length - missingSkills.length) / jdKeywords.length : 1;
            score = Math.round(100 * matchRatio);
            if (['bachelor', 'master', 'degree', 'university'].some(t => applicantText.includes(t))) score += 15;
            if (['experience', 'worked', 'years'].some(t => applicantText.includes(t))) score += 15;
            score = Math.min(score, 100);
        }

        if (score > 0 && score <= 50) {
            const reason = missingSkills.length > 0 ? `Missing core skills: ${missingSkills.join(', ')}.` : 'Limited technical alignment found.';
            await sb.from('applicants').update({ status: 'rejected', stage: 'rejected', rejection_reason: reason }).eq('id', id);
            await sendEmail({
                to: email, subject: `Update regarding your application for ${job.title}`,
                html: `<p>Hi ${first_name},</p><p>Thank you for applying for the ${job.title} position. After reviewing your profile against the technical requirements, we have decided not to move forward with your application.</p><p><strong>Reasoning:</strong> ${reason}</p><p>We appreciate your interest in us.</p>`
            });
        } else if (score >= 90) {
            await sb.from('applicants').update({ stage: 'shortlisted' }).eq('id', id);
        }

        res.status(201).json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.put('/applicants/:id', async (req: any, res: any) => {
    try {
        const updates: any = { updated_at: new Date().toISOString() };
        for (const f of ['first_name', 'last_name', 'email', 'phone', 'resume_url', 'cover_letter', 'stage', 'status'])
            if (req.body[f] !== undefined) updates[f] = req.body[f];
        const { data, error } = await sb.from('applicants').update(updates).eq('id', req.params.id).select().single();
        if (error) throw new Error(error.message);
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// EMAILS
api.post('/emails/bulk-acceptance', async (req: any, res: any) => {
    try {
        const { applicant_ids } = req.body;
        const { data: applicants } = await sb.from('applicants').select('*, jobs(title)').in('id', applicant_ids);
        const result = await sendBulkEmails(applicants || [], 'acceptance', (a) => ({
            subject: `Accepted: ${a.jobs?.title}`,
            html: `<p>Hi ${a.first_name}, you've been accepted for ${a.jobs?.title}.</p>`
        }));
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message || 'Bulk acceptance failed' }); }
});

// ANALYTICS
api.get('/analytics/dashboard', async (req: any, res: any) => {
    try {
        const { count: jobs } = await sb.from('jobs').select('*', { count: 'exact', head: true });
        const { count: applicants } = await sb.from('applicants').select('*', { count: 'exact', head: true });
        res.json({ totalJobs: jobs || 0, totalApplicants: applicants || 0 });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Platform
api.get('/platform/status', async (req: any, res: any) => {
    try {
        const { email } = req.query;
        const { data } = await sb.from('companies').select('*').eq('email', email).maybeSingle();
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// HR TEAM & INVITES
api.get('/hr-team', async (req: any, res: any) => {
    try {
        const companyId = req.headers['x-company-id'];
        const { data: hr } = await sb.from('hr_team').select('*').eq('company_id', companyId);
        const { data: inv } = await sb.from('hr_invitations').select('*').eq('company_id', companyId).eq('status', 'pending');
        const rows = [
            ...(hr || []).map(u => ({ ...u, status: u.status || 'active' })),
            ...(inv || []).map(i => ({ id: i.id, name: 'Invited Member', email: i.email, role_title: i.role_title, status: 'Pending' }))
        ];
        res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/hr-team/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        await sb.from('hr_invitations').delete().eq('id', id);
        await sb.from('hr_team').delete().eq('id', id);
        res.status(204).send();
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/hr-invites/send', async (req: any, res: any) => {
    try {
        const { email, role_title } = req.body;
        const company_id = req.headers['x-company-id'];
        const token = uuidv4();
        const { error } = await sb.from('hr_invitations').insert({ id: uuidv4(), email, role_title, company_id, token, status: 'pending', created_at: new Date().toISOString() });
        if (error) throw new Error(error.message);
        const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${token}`;
        await sendEmail({ to: email, subject: 'Invite to Join HR Team', html: `<p>You've been invited. <a href="${url}">Click here to accept</a></p>` });
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/hr-invites/accept', async (req: any, res: any) => {
    try {
        const { token, name, password } = req.body;
        const { data: inv } = await sb.from('hr_invitations').select('*').eq('token', token).eq('status', 'pending').single();
        if (!inv) return res.status(404).json({ error: 'Invalid token' });
        await sb.from('hr_team').insert({ id: uuidv4(), name, email: inv.email, password, role_title: inv.role_title, company_id: inv.company_id, status: 'active', created_at: new Date().toISOString() });
        await sb.from('hr_invitations').update({ status: 'accepted' }).eq('id', inv.id);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.use('/api', api);
app.use('/', api);

export default app;
