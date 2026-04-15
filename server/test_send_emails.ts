import { get, all, run, initDatabase } from './src/database.js';
import { sendEmail } from './src/services/email.js';

async function sendMissedEmails() {
  await initDatabase();
  console.log('Finding rejected and declined applicants...');

  const applicants = await all<any>("SELECT * FROM applicants WHERE stage IN ('rejected', 'declined')");
  const jobs = await all<any>("SELECT id, title FROM jobs");
  const jobsMap = Object.fromEntries(jobs.map(j => [j.id, j]));

  // Manual join
  const applicantsWithJobs = applicants.map(a => ({
    ...a,
    job_title: jobsMap[a.job_id]?.title || 'Job Application'
  }));

  console.log(`Found ${applicantsWithJobs.length} applicants to resend emails to.`);

  for (const a of applicantsWithJobs) {
    if (!a.email) continue;

    // Add rejection reason if it's currently missing
    let reason = a.rejection_reason;
    if (!reason) {
      reason = "We found your skills to be a bit lacking for the seniority required for this role, though we appreciate your background.";
      await run('UPDATE applicants SET rejection_reason = ? WHERE id = ?', [reason, a.id]);
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e293b;">Application Update: ${a.job_title || 'Job Application'}</h2>
          <p>Hi ${a.first_name},</p>
          <p>Thank you for taking the time to apply for the <strong>${a.job_title || 'position'}</strong> and for your interest in joining our team. We sincerely appreciate the opportunity to review your background.</p>
          <p>After careful consideration, our team has decided to move forward with other candidates at this time.</p>
          <p style="padding: 15px; background: #fef2f2; border-left: 4px solid #ef4444; color: #b91c1c; border-radius: 4px;"><strong>Feedback from our team:</strong><br/>${reason}</p>
          <p>We highly encourage you to apply for future roles with us and wish you the absolute best in your professional journey and future endeavors.</p>
          <br/>
          <p>Best regards,</p>
          <p><strong>The Talent Acquisition Team</strong></p>
      </div>
    `;

    try {
      await sendEmail({
        to: a.email,
        subject: `Update regarding your application for ${a.job_title || 'our company'}`,
        html: emailHtml
      });
      console.log(`Email resent successfully to ${a.email}`);
    } catch (e) {
      console.error(`Failed to send email to ${a.email}:`, e);
    }
  }

  console.log('Script finished.');
}

sendMissedEmails().catch(console.error);
