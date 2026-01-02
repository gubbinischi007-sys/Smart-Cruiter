import express from 'express';
import { get, all } from '../database.js';
import { sendEmail, sendBulkEmails } from '../services/email.js';

const router = express.Router();

// Send bulk acceptance emails
router.post('/bulk-acceptance', async (req, res) => {
  try {
    const { applicant_ids } = req.body;

    if (!Array.isArray(applicant_ids) || applicant_ids.length === 0) {
      return res.status(400).json({ error: 'applicant_ids array is required' });
    }

    const placeholders = applicant_ids.map(() => '?').join(',');
    const applicants = await all<any>(
      `SELECT a.*, j.title as job_title 
       FROM applicants a 
       LEFT JOIN jobs j ON a.job_id = j.id 
       WHERE a.id IN (${placeholders})`,
      applicant_ids
    );

    if (applicants.length === 0) {
      return res.status(404).json({ error: 'No applicants found' });
    }

    const results = await sendBulkEmails(
      applicants,
      'acceptance',
      (applicant) => ({
        subject: `Congratulations! You've been accepted for ${applicant.job_title}`,
        html: `
          <h2>Congratulations ${applicant.first_name}!</h2>
          <p>We are pleased to inform you that you have been accepted for the position of <strong>${applicant.job_title}</strong>.</p>
          <p>Our HR team will be in touch with you shortly regarding next steps.</p>
          <p>Best regards,<br>Smart-Cruiter Team</p>
        `,
      })
    );

    res.json({
      message: `Sent ${results.successful} acceptance emails`,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Error sending bulk acceptance emails:', error);
    res.status(500).json({ error: 'Failed to send bulk acceptance emails' });
  }
});

// Send bulk rejection emails
router.post('/bulk-rejection', async (req, res) => {
  try {
    const { applicant_ids } = req.body;

    if (!Array.isArray(applicant_ids) || applicant_ids.length === 0) {
      return res.status(400).json({ error: 'applicant_ids array is required' });
    }

    const placeholders = applicant_ids.map(() => '?').join(',');
    const applicants = await all<any>(
      `SELECT a.*, j.title as job_title 
       FROM applicants a 
       LEFT JOIN jobs j ON a.job_id = j.id 
       WHERE a.id IN (${placeholders})`,
      applicant_ids
    );

    if (applicants.length === 0) {
      return res.status(404).json({ error: 'No applicants found' });
    }

    const results = await sendBulkEmails(
      applicants,
      'rejection',
      (applicant) => ({
        subject: `Application Update: ${applicant.job_title}`,
        html: `
          <h2>Thank you for your interest, ${applicant.first_name}</h2>
          <p>We appreciate you taking the time to apply for the position of <strong>${applicant.job_title}</strong>.</p>
          <p>After careful consideration, we have decided to move forward with other candidates. We encourage you to apply for future opportunities that match your skills and experience.</p>
          <p>Best regards,<br>Smart-Cruiter Team</p>
        `,
      })
    );

    res.json({
      message: `Sent ${results.successful} rejection emails`,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Error sending bulk rejection emails:', error);
    res.status(500).json({ error: 'Failed to send bulk rejection emails' });
  }
});

export { router as emailRoutes };

