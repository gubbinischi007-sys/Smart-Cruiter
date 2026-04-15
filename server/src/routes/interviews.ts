import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as ics from 'ics';
import { run, get, all } from '../database.js';
import { Interview, CreateInterviewInput, UpdateInterviewInput } from '../models/interview.js';
import { sendEmail } from '../services/email.js';
import { format, addHours } from 'date-fns';
import { logHrAction } from '../services/activityLogger.js';

const router = express.Router();

// Get all interviews (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { applicant_id, job_id, status } = req.query;
    const companyId = req.headers['x-company-id'];
    const [interviews, applicants, jobs] = await Promise.all([
      all<any>('SELECT * FROM interviews'),
      all<any>('SELECT id, first_name, last_name, email FROM applicants'),
      all<any>('SELECT id, title, company_id FROM jobs')
    ]);

    const applicantsMap = Object.fromEntries(applicants.map(a => [a.id, a]));
    const jobsMap = Object.fromEntries(jobs.map(j => [j.id, j]));

    const filteredInterviews = interviews
      .filter(i => {
        const applicant = applicantsMap[i.applicant_id];
        const job = jobsMap[i.job_id];
        if (!applicant || !job) return false;
        
        if (companyId && job.company_id !== companyId) return false;
        if (applicant_id && i.applicant_id !== applicant_id) return false;
        if (job_id && i.job_id !== job_id) return false;
        if (status && i.status !== status) return false;
        return true;
      })
      .map(i => ({
        ...i,
        applicant_name: `${applicantsMap[i.applicant_id].first_name} ${applicantsMap[i.applicant_id].last_name}`,
        applicant_email: applicantsMap[i.applicant_id].email,
        job_title: jobsMap[i.job_id].title
      }))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

    res.json(filteredInterviews);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// Get interview by ID
router.get('/:id', async (req, res) => {
  try {
    const interview = await get<any>('SELECT * FROM interviews WHERE id = ?', [req.params.id]);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const [applicant, job] = await Promise.all([
      get('SELECT first_name, last_name, email FROM applicants WHERE id = ?', [interview.applicant_id]),
      get('SELECT title FROM jobs WHERE id = ?', [interview.job_id])
    ]);

    res.json({
      ...interview,
      applicant_name: applicant ? `${applicant.first_name} ${applicant.last_name}` : 'Unknown Applicant',
      applicant_email: applicant?.email || '',
      job_title: job?.title || 'Unknown Position'
    });
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
});

// Create interview
router.post('/', async (req, res) => {
  try {
    const input: CreateInterviewInput = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    // Verify applicant and job exist
    const applicant = await get('SELECT id, first_name, last_name, email FROM applicants WHERE id = ?', [input.applicant_id]);
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    const job = await get('SELECT id, title FROM jobs WHERE id = ?', [input.job_id]);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Auto-generate meeting link for online interviews if missing
    let finalMeetingLink = input.meeting_link;
    if ((!input.type || input.type === 'online') && !finalMeetingLink) {
      finalMeetingLink = `https://meet.smartcruiter.com/${id.split('-')[0]}`;
    }

    await run(
      `INSERT INTO interviews (id, applicant_id, job_id, scheduled_at, type, meeting_link, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.applicant_id,
        input.job_id,
        input.scheduled_at,
        input.type || 'online',
        finalMeetingLink || null,
        input.notes || null,
        'scheduled',
        now,
        now,
      ]
    );

    // Prepare Calendar Invite (ics)
    const startDate = new Date(input.scheduled_at);
    const event: ics.EventAttributes = {
      start: [
        startDate.getUTCFullYear(),
        startDate.getUTCMonth() + 1,
        startDate.getUTCDate(),
        startDate.getUTCHours(),
        startDate.getUTCMinutes()
      ],
      startInputType: 'utc',
      duration: { hours: 1, minutes: 0 },
      title: `Interview: ${job.title} at SmartCruiter`,
      description: `Interview for ${job.title} position.\nNotes: ${input.notes || ''}`,
      location: finalMeetingLink || 'Our Main Office',
      url: finalMeetingLink || '',
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: 'SmartCruiter HR', email: 'hr@smartcruiter.com' },
      attendees: [
        { name: `${applicant.first_name} ${applicant.last_name}`, email: applicant.email, rsvp: true, role: 'REQ-PARTICIPANT' }
      ]
    };

    ics.createEvent(event, async (error, value) => {
      if (!error && value) {
        // Send email with ICS attachment
        try {
          // You need to configure nodemailer in `sendEmail` to accept attachments if you want the actual .ics file,
          // but just providing the raw text in the body or standard calendar header also works. We will just send it as an email.
          // For a true calendar invite, it would be attached, here we simulate by notifying.
          // In a real app we would modify `sendEmail` to accept `alternatives` or `attachments`. 
          const emailHtml = `
            <h2>Interview Scheduled: ${job.title}</h2>
            <p>Hi ${applicant.first_name},</p>
            <p>Your interview has been scheduled for <strong>${format(startDate, 'MMMM do, yyyy h:mm a')}</strong>.</p>
            <p>${finalMeetingLink ? `Meeting Link: <a href="${finalMeetingLink}">${finalMeetingLink}</a>` : 'Location: Our Main Office'}</p>
            <p>Please find the calendar invite details added to your schedule.</p>
          `;
          await sendEmail({
            to: applicant.email,
            subject: `Interview Scheduled: ${job.title}`,
            html: emailHtml,
          });
        } catch (e) {
          console.error('Failed to send calendar invite', e);
        }
      }
    });

    const interview = await get<Interview>('SELECT * FROM interviews WHERE id = ?', [id]);
    
    // Log action
    await logHrAction(req, `Scheduled ${input.type || 'online'} interview for ${applicant.first_name} ${applicant.last_name} (${job.title})`);

    res.status(201).json(interview);
  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({ error: 'Failed to create interview' });
  }
});

// Update interview
router.put('/:id', async (req, res) => {
  try {
    const input: UpdateInterviewInput = req.body;
    const existing = await get<Interview>('SELECT * FROM interviews WHERE id = ?', [req.params.id]);

    if (!existing) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (input.scheduled_at !== undefined) {
      updates.push('scheduled_at = ?');
      params.push(input.scheduled_at);
    }
    if (input.type !== undefined) {
      updates.push('type = ?');
      params.push(input.type);
    }
    if (input.meeting_link !== undefined) {
      updates.push('meeting_link = ?');
      params.push(input.meeting_link);
    }
    if (input.notes !== undefined) {
      updates.push('notes = ?');
      params.push(input.notes);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      params.push(input.status);
    }
    if (input.rating !== undefined) {
      updates.push('rating = ?');
      params.push(input.rating);
    }
    if (input.feedback !== undefined) {
      updates.push('feedback = ?');
      params.push(input.feedback);
    }

    if (updates.length === 0) {
      return res.json(existing);
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(req.params.id);

    await run(
      `UPDATE interviews SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updated = await get<Interview>('SELECT * FROM interviews WHERE id = ?', [req.params.id]);

    // Post-Interview Scorecard Logic: automatically move to Recommended if rating >= 4
    if (input.rating !== undefined && input.rating >= 4) {
      await run(`UPDATE applicants SET stage = 'recommended', updated_at = ? WHERE id = ?`, [new Date().toISOString(), existing.applicant_id]);
      console.log(`Applicant ${existing.applicant_id} auto-promoted to recommended due to high rating (${input.rating})`);
    }

    // Log action
    const details = await get<any>('SELECT a.first_name, a.last_name FROM applicants a WHERE id = ?', [existing.applicant_id]);
    await logHrAction(req, `Updated interview status to ${input.status || 'updated'} for ${details?.first_name || 'candidate'} ${details?.last_name || ''}`);

    res.json(updated);
  } catch (error) {
    console.error('Error updating interview:', error);
    res.status(500).json({ error: 'Failed to update interview' });
  }
});

// Delete interview
router.delete('/:id', async (req, res) => {
  try {
    const existing = await get<Interview>('SELECT * FROM interviews WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    await run('DELETE FROM interviews WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({ error: 'Failed to delete interview' });
  }
});

export { router as interviewRoutes };

