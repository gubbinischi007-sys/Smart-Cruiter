import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { run, get, all } from '../database.js';
import { Applicant, CreateApplicantInput, UpdateApplicantInput, ApplicantStage } from '../models/applicant.js';
import { sendEmail } from '../services/email.js';
import { calculateMatchScore } from '../services/matchingService.js';
import { logHrAction } from '../services/activityLogger.js';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');
const pdfParse: (buffer: Buffer) => Promise<{ text: string }> = typeof pdfParseModule === 'function' ? pdfParseModule : pdfParseModule.default;

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

async function logToHistory(applicant: any, status: 'Accepted' | 'Rejected' | 'Deactivated', reason: string, companyId?: any) {
  try {
    const job = await get<any>('SELECT title FROM jobs WHERE id = ?', [applicant.job_id]);
    const id = uuidv4();
    await run(
      'INSERT INTO application_history (id, name, email, job_title, status, reason, company_id, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        `${applicant.first_name} ${applicant.last_name}`,
        applicant.email,
        job?.title || 'Unknown Position',
        status,
        reason,
        companyId || null,
        new Date().toISOString()
      ]
    );
  } catch (err) {
    console.error('Failed to log to history:', err);
  }
}

// Get all applicants (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { job_id, stage, status, email } = req.query;
    const companyId = req.headers['x-company-id'];
    
    // Fetch applicants directly from table using shim-friendly logic
    const params: any[] = [];
    let query = 'SELECT * FROM applicants WHERE 1=1';
    
    if (email) {
      query += ' AND email = ?';
      params.push(email);
    }
    if (job_id) {
      query += ' AND job_id = ?';
      params.push(job_id);
    }
    if (stage) {
      query += ' AND stage = ?';
      params.push(stage);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY applied_at DESC';

    let applicants = await all<any>(query, params);

    // If we have an email but 0 results, retry with lowercase (case-insensitivity fallback)
    if (email && applicants.length === 0) {
      applicants = await all<any>('SELECT * FROM applicants WHERE LOWER(email) = ?', [(email as string).toLowerCase()]);
    }

    // Attach job titles manually (shim doesn't handle JOINS well)
    const jobs = await all<any>('SELECT id, title, company_id FROM jobs');
    const jobsMap = Object.fromEntries(jobs.map(j => [j.id, j]));

    const result = applicants
      .filter(a => {
        // If searching by email (Candidate), show everything matching that email
        if (email) return true;
        // Otherwise (Recruiter), filter by company
        return !companyId || (jobsMap[a.job_id] && jobsMap[a.job_id].company_id === companyId);
      })
      .map(a => ({
        ...a,
        job_title: jobsMap[a.job_id]?.title || 'Unknown Position',
        score: a.score || 0
      }));


    res.json(result);
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ error: 'Failed to fetch applicants' });
  }
});


// Retroactive Sync of Stages for ALL existing applicants
router.get('/sync-all', async (req, res) => {
    try {
        const applicants = await all<any>('SELECT a.*, j.title as job_title, j.requirements, j.description FROM applicants a LEFT JOIN jobs j ON a.job_id = j.id');
        const results = { rejected: 0, shortlisted: 0, unchanged: 0 };

        const stopWords = new Set(['the', 'and', 'to', 'of', 'in', 'for', 'with', 'on', 'is', 'as', 'at', 'by', 'an', 'be', 'this', 'that', 'are', 'from', 'or', 'have', 'has', 'will', 'you', 'your', 'we', 'our', 'it', 'can', 'all', 'more', 'their', 'which', 'about', 'what', 'how', 'when', 'where', 'who', 'not', 'but', 'so', 'if', 'then', 'than', 'such', 'into', 'out', 'up', 'down', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'some', 'any', 'both', 'each', 'few', 'most', 'other', 'no', 'nor', 'only', 'own', 'same', 'too', 'very', 'job', 'role', 'team', 'work', 'company', 'experience', 'skills', 'looking', 'years', 'working', 'using', 'ability', 'knowledge', 'strong', 'good', 'excellent', 'responsible', 'developing', 'maintaining', 'building', 'creating', 'testing', 'writing', 'managing', 'leading', 'supporting', 'understanding', 'ensure', 'ensuring', 'provide', 'providing', 'required', 'requirements', 'including', 'design', 'designing', 'development', 'software', 'applications', 'systems', 'business', 'data', 'technical', 'technology', 'environment', 'project', 'projects', 'solutions', 'process', 'processes', 'management', 'client', 'clients', 'user', 'users', 'product', 'products', 'service', 'services', 'support', 'performance', 'quality', 'best', 'practices', 'drive', 'driving', 'within', 'across', 'highly', 'related', 'field', 'computer', 'science', 'engineering', 'equivalent']);

        const extractJDKeywords = (text: string) => {
            if (!text) return [];
            const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
            const words = cleanText.split(/\s+/);
            const keywordCounts: Record<string, number> = {};
            words.forEach(w => { if (w.length >= 2 && !stopWords.has(w)) keywordCounts[w] = (keywordCounts[w] || 0) + 1; });
            return Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0]);
        };

        for (const applicant of applicants) {
            let bodyText = (applicant.resume_text || '').toLowerCase();
            
            if (bodyText.length < 50 && applicant.resume_url) {
                try {
                    const response = await fetch(applicant.resume_url);
                    if (response.ok) {
                        const buffer = Buffer.from(await response.arrayBuffer());
                        const parseFunc = (pdfParseModule as any).default || pdfParseModule;
                        const parsed = await parseFunc(buffer);
                        if (parsed && parsed.text) {
                            bodyText = parsed.text.toLowerCase();
                            // Cache parsed text
                            await run('UPDATE applicants SET resume_text = ? WHERE id = ?', [bodyText, applicant.id]);
                        }
                    }
                } catch (e) {
                    console.warn(`[Sync] Failed to parse resume for ${applicant.email}:`, (e as Error).message);
                }
            }

            const simulatedFallback = 'university bachelor degree master degree developer engineer experience professional intern software java python javascript react node sql aws';
            const finalBodyText = bodyText.length > 50 ? bodyText : simulatedFallback;

            const applicantText = `${applicant.job_title || ''} ${applicant.first_name || ''} ${applicant.resume_url || ''} ${applicant.cover_letter || ''} ${finalBodyText}`.toLowerCase();
            const matchResult = await calculateMatchScore(applicantText, applicant.requirements || applicant.description || '', applicant.job_title || '');
            const score = matchResult.score;

            if (score <= 50) {
                const autoRejectReason = matchResult.missingSkills.length > 0 && matchResult.missingSkills[0] !== 'None (Strong Match)'
                    ? `Matching failed for core requirements: ${matchResult.missingSkills.slice(0, 3).join(', ')}.`
                    : 'Profile alignment below professional threshold for this role.';
                
                await run('UPDATE applicants SET status = ?, stage = ?, rejection_reason = ?, score = ? WHERE id = ?', ['rejected', 'rejected', autoRejectReason, score, applicant.id]);
                results.rejected++;
            } else if (score >= 90) {
                await run('UPDATE applicants SET stage = ?, score = ? WHERE id = ?', ['shortlisted', score, applicant.id]);
                results.shortlisted++;
            } else if (score >= 81) {
                await run('UPDATE applicants SET stage = ?, score = ? WHERE id = ?', ['recommended', score, applicant.id]);
                results.unchanged++;
            } else {
                await run('UPDATE applicants SET stage = ?, score = ? WHERE id = ?', ['applied', score, applicant.id]);
                results.unchanged++;
            }
        }

        res.json({ message: 'Dynamic synchronization complete', results });
    } catch (error) {
        console.error('Error syncing applicants:', error);
        res.status(500).json({ error: 'Failed to sync applicants' });
    }
});

// Get applicant by ID
router.get('/:id', async (req, res) => {
  try {
    const applicant = await get<any>(
      `SELECT a.*, j.title as job_title, j.department, j.location 
       FROM applicants a 
       LEFT JOIN jobs j ON a.job_id = j.id 
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }
    res.json(applicant);
  } catch (error) {
    console.error('Error fetching applicant:', error);
    res.status(500).json({ error: 'Failed to fetch applicant' });
  }
});

// Create applicant
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const input: CreateApplicantInput = req.body;
    let actualPdfText = '';

    if (req.file) {
      try {
        console.log(`[PDF] Received file: ${req.file.originalname} (${req.file.size} bytes)`);
        // Save file locally
        const fs = require('fs');
        const path = require('path');
        const fileId = uuidv4();
        const fileExtension = req.file.originalname.split('.').pop();
        const localFileName = `${fileId}.${fileExtension}`;
        const localPath = path.join(process.cwd(), 'public', 'uploads', localFileName);
        
        fs.writeFileSync(localPath, req.file.buffer);
        console.log(`[PDF] Saved original file to: ${localPath}`);
        
        // Set the resume_url to the local path
        input.resume_url = `/uploads/${localFileName}`;

        const parseFunc = (pdfParseModule as any).default || pdfParseModule;
        if (typeof parseFunc === 'function') {
          const parsed = await parseFunc(req.file.buffer);
          actualPdfText = parsed.text || '';
          console.log(`[PDF] Parsed ${actualPdfText.length} chars of text`);
        }
      } catch (err) {
        console.error("[PDF Parsing error]:", err);
      }
    } else {
      console.log('[PDF] No file received - using fallback scoring');
    }

    // Basic input validation
    if (!input.job_id || !input.first_name || !input.last_name || !input.email) {
      return res.status(400).json({ error: 'job_id, first_name, last_name and email are required' });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const id = uuidv4();
    const trackingId = `APP-${uuidv4().substring(0, 7).toUpperCase()}`;
    const now = new Date().toISOString();

    // Verify job exists and is open
    const job = await get<any>('SELECT * FROM jobs WHERE id = ?', [input.job_id]);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.status !== 'open') {
      return res.status(400).json({ error: 'Job is not open for applications' });
    }

    try {
      // 1. Try modern schema with tracking_id and resume_text
      await run(
        `INSERT INTO applicants (id, job_id, first_name, last_name, email, phone, resume_url, cover_letter, resume_text, stage, status, applied_at, updated_at, tracking_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, input.job_id, input.first_name, input.last_name, input.email, input.phone || null, input.resume_url || null, input.cover_letter || null, actualPdfText || null, 'applied', 'active', now, now, trackingId]
      );
    } catch (err: any) {
      try {
        // 2. Fallback: try without tracking_id
        await run(
          `INSERT INTO applicants (id, job_id, first_name, last_name, email, phone, resume_url, cover_letter, resume_text, stage, status, applied_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, input.job_id, input.first_name, input.last_name, input.email, input.phone || null, input.resume_url || null, input.cover_letter || null, actualPdfText || null, 'applied', 'active', now, now]
        );
      } catch (err2: any) {
        // 3. Last Fallback: basic schema
        await run(
          `INSERT INTO applicants (id, job_id, first_name, last_name, email, phone, resume_url, cover_letter, stage, status, applied_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, input.job_id, input.first_name, input.last_name, input.email, input.phone || null, input.resume_url || null, input.cover_letter || null, 'applied', 'active', now, now]
        );
      }
    }


    const applicant = await get<Applicant>('SELECT * FROM applicants WHERE id = ?', [id]);

    // AI Matching Logic using matchingService
    const applicantText = `${job.title || ''} ${input.first_name || ''} ${input.resume_url || ''} ${input.cover_letter || ''} ${actualPdfText}`.toLowerCase();
    const matchResult = await calculateMatchScore(applicantText, job.requirements || job.description || '', job.title || '');
    const score = matchResult.score;
    const missingSkills = matchResult.missingSkills;

    // Automation: Update score and handle stage transitions
    try {
      if (score <= 50) {
        // Low score -> Auto-Reject
        const autoRejectReason = missingSkills.length > 0 && missingSkills[0] !== 'None (Strong Match)'
          ? `Your application did not highlight the core skills required: ${missingSkills.slice(0, 3).join(', ')}.`
          : 'Your application did not strongly align with the technical requirements of this role.';
        
        await run('UPDATE applicants SET status = ?, stage = ?, rejection_reason = ?, score = ? WHERE id = ?', ['rejected', 'rejected', autoRejectReason, score, id]);
        
        if (applicant) {
          applicant.status = 'rejected';
          applicant.stage = 'rejected' as any;
          (applicant as any).rejection_reason = autoRejectReason;
          (applicant as any).score = score;
        }

        // Send Rejection Email
        const formattedSkills = missingSkills[0] !== 'None (Strong Match)' 
          ? missingSkills.slice(0, 3).map(s => `<li><strong>${s}</strong></li>`).join('')
          : '<li>Core Domain Expertise</li>';

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1e293b;">Update on your application for ${job.title}</h2>
              <p>Hi ${input.first_name},</p>
              <p>After careful consideration, our team has decided to move forward with candidates whose technical experience more closely aligns with the specific requirements of this role.</p>
              <p>Our review system noted that your resume did not strongly highlight experience with:</p>
              <ul style="color: #b91c1c; background: #fef2f2; padding: 15px 30px; border-radius: 5px; border-left: 4px solid #ef4444;">
                  ${formattedSkills}
              </ul>
              <p>We wish you the best in your professional journey.</p>
          </div>
        `;

        sendEmail({
          to: input.email,
          subject: `Update regarding your application for ${job.title}`,
          html: emailHtml
        }).catch(err => console.error('Failed to send auto-reject email:', err));

      } else if (score >= 90) {
        // High score -> Auto-Shortlist
        await run('UPDATE applicants SET score = ?, stage = ?, status = ? WHERE id = ?', [score, 'shortlisted', 'active', id]);
        if (applicant) {
          applicant.stage = 'shortlisted';
          (applicant as any).score = score;
        }
      } else {
        // Normal score -> Default Applied
        const stage = score >= 81 ? 'recommended' : 'applied';
        await run('UPDATE applicants SET score = ?, stage = ? WHERE id = ?', [score, stage, id]);
        if (applicant) {
          applicant.stage = stage as any;
          (applicant as any).score = score;
        }
      }
    } catch (e: any) {
      console.warn('[Automation Warning] Error during stage update:', e.message);
      // Fallback update without 'score' field if it fails
      await run('UPDATE applicants SET stage = ? WHERE id = ?', [score <= 50 ? 'rejected' : 'applied', id]);
    }
    // -------------------------------------------------------------

    res.status(201).json(applicant);
  } catch (error: any) {
    console.error('Error creating applicant:', error);
    res.status(500).json({ error: error.message || 'Failed to create applicant' });
  }
});


// Update applicant
router.put('/:id', async (req, res) => {
  try {
    const input: UpdateApplicantInput = req.body;
    const existing = await get<Applicant>('SELECT * FROM applicants WHERE id = ?', [req.params.id]);

    if (!existing) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (input.first_name !== undefined) {
      updates.push('first_name = ?');
      params.push(input.first_name);
    }
    if (input.last_name !== undefined) {
      updates.push('last_name = ?');
      params.push(input.last_name);
    }
    if (input.email !== undefined) {
      updates.push('email = ?');
      params.push(input.email);
    }
    if (input.phone !== undefined) {
      updates.push('phone = ?');
      params.push(input.phone);
    }
    if (input.resume_url !== undefined) {
      updates.push('resume_url = ?');
      params.push(input.resume_url);
    }
    if (input.cover_letter !== undefined) {
      updates.push('cover_letter = ?');
      params.push(input.cover_letter);
    }
    if (input.stage !== undefined) {
      updates.push('stage = ?');
      params.push(input.stage);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      params.push(input.status);
    }
    if (input.rejection_reason !== undefined) {
      updates.push('rejection_reason = ?');
      params.push(input.rejection_reason);
    }

    if (updates.length === 0) {
      return res.json(existing);
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(req.params.id);

    await run(
      `UPDATE applicants SET ${updates.join(', ')} WHERE id = ? `,
      params
    );

    const updated = await get<Applicant>('SELECT * FROM applicants WHERE id = ?', [req.params.id]);

    // Send rejection email if stage was changed to rejected or declined
    if (input.stage === 'rejected' || input.stage === 'declined') {
      if (existing.stage !== 'rejected' && existing.stage !== 'declined') {
        const jobForEmail = await get<any>('SELECT title FROM jobs WHERE id = ?', [existing.job_id]);

        const emailHtml = `
        < div style = "font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;" >
          <h2 style="color: #1e293b;" > Application Update: ${jobForEmail?.title || 'Job Application'} </h2>
            < p > Hi ${existing.first_name}, </p>
              < p > Thank you for taking the time to apply for the < strong > ${jobForEmail?.title || 'position'} </strong> and for your interest in joining our team. We sincerely appreciate the opportunity to review your background.</p >
                <p>After careful consideration, our team has decided to move forward with other candidates at this time.</p>
              ${input.rejection_reason ? `<p style="padding: 15px; background: #fef2f2; border-left: 4px solid #ef4444; color: #b91c1c; border-radius: 4px;"><strong>Feedback from our team:</strong><br/>${input.rejection_reason}</p>` : ''}
    <p>We highly encourage you to apply for future roles with us and wish you the absolute best in your professional journey and future endeavors.</p>
      < br />
      <p>Best regards, </p>
        < p > <strong>The Talent Acquisition Team < /strong></p >
          </div>
            `;
        try {
          await sendEmail({
            to: existing.email,
            subject: `Update regarding your application for ${jobForEmail?.title || 'our company'}`,
            html: emailHtml
          });
          console.log(`Rejection email sent to ${existing.email} `);
        } catch (emailErr) {
          console.error("Failed to send rejection email on manual update:", emailErr);
        }
      }
    }

    // Log terminal status changes to History
    const companyId = req.headers['x-company-id'];
    if (input.stage === 'hired') {
      await logToHistory(updated, 'Accepted', 'Candidate hired successfully', companyId);
    } else if (input.stage === 'rejected' || input.stage === 'declined') {
      await logToHistory(updated, 'Rejected', input.rejection_reason || 'Application not approved', companyId);
    } else if (input.stage === 'withdrawn') {
      await logToHistory(updated, 'Deactivated', 'Candidate withdrew application', companyId);
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating applicant:', error);
    res.status(500).json({ error: 'Failed to update applicant' });
  }
});

// Bulk update applicant stages
router.post('/bulk-update-stage', async (req, res) => {
  try {
    const { applicant_ids, stage } = req.body;

    if (!Array.isArray(applicant_ids) || !stage) {
      return res.status(400).json({ error: 'applicant_ids (array) and stage are required' });
    }

    const placeholders = applicant_ids.map(() => '?').join(',');

    let setClause = `stage = ?, updated_at = ? `;
    const args: any[] = [stage, new Date().toISOString()];

    if (req.body.rejection_reason) {
      setClause += `, rejection_reason = ? `;
      args.push(req.body.rejection_reason);
    }

    args.push(...applicant_ids);

    await run(
      `UPDATE applicants SET ${setClause} WHERE id IN(${placeholders})`,
      args
    );

    // Send emails if stage is rejected
    if (stage === 'rejected' || stage === 'declined') {
      const applicantsToEmail = await all<any>(`SELECT a.email, a.first_name, j.title as job_title FROM applicants a LEFT JOIN jobs j ON a.job_id = j.id WHERE a.id IN(${placeholders})`, [...applicant_ids]);
      for (const a of applicantsToEmail) {
        if (!a.email) continue;
        const emailHtml = `
    < div style = "font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;" >
      <h2 style="color: #1e293b;" > Application Update: ${a.job_title || 'Job Application'} </h2>
        < p > Hi ${a.first_name}, </p>
          < p > Thank you for taking the time to apply for the < strong > ${a.job_title || 'position'} < /strong> and for your interest in joining our team. We sincerely appreciate the opportunity to review your background.</p >
            <p>After careful consideration, our team has decided to move forward with other candidates at this time.</p>
              ${req.body.rejection_reason ? `<p style="padding: 15px; background: #fef2f2; border-left: 4px solid #ef4444; color: #b91c1c; border-radius: 4px;"><strong>Feedback from our team:</strong><br/>${req.body.rejection_reason}</p>` : ''}
  <p>We highly encourage you to apply for future roles with us and wish you the absolute best in your professional journey and future endeavors.</p>
    < br />
    <p>Best regards, </p>
      < p > <strong>The Talent Acquisition Team < /strong></p >
        </div>
          `;
        try {
          // Fire and forget
          sendEmail({
            to: a.email,
            subject: `Update regarding your application for ${a.job_title || 'our company'}`,
            html: emailHtml
          }).catch(console.error);
        } catch (e) {
          console.error(e);
        }
      }
    }

    // Log terminal status changes for bulk updates
    const companyId = req.headers['x-company-id'];
    if (stage === 'hired' || stage === 'rejected' || stage === 'declined') {
        const updatedApplicants = await all<any>(`SELECT * FROM applicants WHERE id IN(${placeholders})`, [...applicant_ids]);
        for (const a of updatedApplicants) {
            const status = stage === 'hired' ? 'Accepted' : 'Rejected';
            const reason = req.body.rejection_reason || (stage === 'hired' ? 'Bulk hired' : 'Bulk update rejection');
            await logToHistory(a, status, reason, companyId);
        }
    }

    res.json({ message: `Updated ${applicant_ids.length} applicants to stage: ${stage} ` });
  } catch (error) {
    console.error('Error bulk updating applicants:', error);
    res.status(500).json({ error: 'Failed to bulk update applicants' });
  }
});

// Delete all applicants
router.delete('/', async (req, res) => {
  try {
    await run('DELETE FROM applicants');
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting all applicants:', error);
    res.status(500).json({ error: 'Failed to delete all applicants' });
  }
});

// Delete applicant
router.delete('/:id', async (req, res) => {
  try {
    const existing = await get<Applicant>('SELECT * FROM applicants WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    await run('DELETE FROM applicants WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting applicant:', error);
    res.status(500).json({ error: 'Failed to delete applicant' });
  }
});

// Send job offer to applicant
router.patch('/:id/offer', async (req, res) => {
  try {
    const { salary, joining_date, notes, rules } = req.body;
    const now = new Date().toISOString();

    const existing = await get<any>(`
      SELECT a.*, j.title as job_title 
      FROM applicants a 
      LEFT JOIN jobs j ON a.job_id = j.id 
      WHERE a.id = ? `,
      [req.params.id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    await run(
      `UPDATE applicants 
       SET offer_salary = ?,
    offer_joining_date = ?,
    offer_notes = ?,
    offer_rules = ?,
    offer_status = 'pending',
    offer_sent_at = ?,
    updated_at = ?
      WHERE id = ? `,
      [salary, joining_date, notes, rules, now, now, req.params.id]
    );

    // Send Offer Email
    try {
      await sendEmail({
        to: existing.email,
        subject: `Job Offer from Smart - Cruiter`,
        html: `
    < h2 > Congratulations ${existing.first_name} !</h2>
      < p > We are thrilled to offer you the position of < strong > ${existing.job_title} </strong> at Smart-Cruiter Inc.</p >

        <h3>Offer Details: </h3>
          < ul >
          <li><strong>Annual Salary: </strong> ${salary}</li >
            <li><strong>Joining Date: </strong> ${joining_date}</li >
              </ul>
          
          ${notes ? `<h3>Benefits & Notes:</h3><p>${notes}</p>` : ''}

  <p>Please log in to your candidate dashboard to view the full offer letter and accept / reject it.</p>
    < a href = "${process.env.VITE_CLIENT_URL || 'http://localhost:3000'}/candidate/applications/${existing.id}/status" style = "display:inline-block;padding:10px 20px;background:#6366f1;color:white;text-decoration:none;border-radius:5px;margin-top:10px;" > View Offer Details </a>

      < p > Best regards, <br>The Smart - Cruiter Team </p>
        `
      });
    } catch (emailError) {
      console.error("Failed to send offer email:", emailError);
    }

    const updated = await get<Applicant>('SELECT * FROM applicants WHERE id = ?', [req.params.id]);
    
    // Log action
    await logHrAction(req, `Sent offer letter to ${existing.first_name} ${existing.last_name} for ${existing.job_title}`);

    res.json({ message: 'Offer sent successfully', applicant: updated });
  } catch (error) {
    console.error('Error sending offer:', error);
    res.status(500).json({ error: 'Failed to send offer' });
  }
});

// Candidate response to offer
router.post('/:id/offer-response', async (req, res) => {
  try {
    const { response } = req.body; // 'accepted' or 'rejected'

    if (response !== 'accepted' && response !== 'rejected') {
      return res.status(400).json({ error: 'Response must be "accepted" or "rejected"' });
    }

    const existing = await get<Applicant>('SELECT * FROM applicants WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    if (!existing.offer_sent_at) {
      return res.status(400).json({ error: 'No offer found for this candidate' });
    }

    const stage = response === 'accepted' ? 'hired' : 'declined';
    const now = new Date().toISOString();

    await run(
      `UPDATE applicants 
       SET offer_status = ?,
    stage = ?,
    updated_at = ?
      WHERE id = ? `,
      [response, stage, now, req.params.id]
    );

    // Log terminal status changes for offer response
    const companyId = req.headers['x-company-id'];
    const updated = await get<any>('SELECT * FROM applicants WHERE id = ?', [req.params.id]);
    const status = response === 'accepted' ? 'Accepted' : 'Rejected';
    const reason = response === 'accepted' ? 'Candidate accepted the offer' : 'Candidate declined the offer';
    await logToHistory(updated, status, reason, companyId);

    res.json({ message: `Offer ${response} successfully`, stage });
  } catch (error) {
    console.error('Error responding to offer:', error);
    res.status(500).json({ error: 'Failed to process offer response' });
  }
});


// DEBUG: Get raw resume text for an applicant
router.get('/debug/:id', async (req, res) => {
  try {
    const applicant = await get<any>('SELECT first_name, last_name, resume_text, resume_url FROM applicants WHERE id = ?', [req.params.id]);
    if (!applicant) return res.status(404).json({ error: 'Applicant not found' });
    res.json(applicant);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { router as applicantRoutes };

