import cron from 'node-cron';
import { all, run } from '../database.js';
import { sendEmail } from './email.js';
import { format, addHours, differenceInHours } from 'date-fns';

export function startReminderCron() {
    console.log('⏰ Interview Reminder Cron Job Initialized (Runs every 15 mins)');

    // Run every 15 minutes to check for upcoming interviews
    cron.schedule('*/15 * * * *', async () => {
        try {
            console.log('Checking for upcoming interviews to send reminders...');

            // Get current UTC time
            const now = new Date();

            // Find interviews that are scheduled in the next 24.5 hours but haven't received a reminder
            // We look at scheduled_at which should be an ISO string
            const interviews = await all(`
        SELECT i.*, a.first_name, a.last_name, a.email, j.title as job_title 
        FROM interviews i
        JOIN applicants a ON i.applicant_id = a.id
        JOIN jobs j ON i.job_id = j.id
        WHERE i.status = 'scheduled' AND i.reminder_sent = 0
      `);

            for (const interview of interviews) {
                if (!interview.scheduled_at) continue;

                const scheduledTime = new Date(interview.scheduled_at);
                const hoursUntilInterview = differenceInHours(scheduledTime, now);

                // If the interview is between 0 and 24 hours from now, it's time to send the reminder
                if (hoursUntilInterview >= 0 && hoursUntilInterview <= 24) {

                    const formattedDate = format(scheduledTime, 'MMMM do, yyyy');
                    const formattedTime = format(scheduledTime, 'h:mm a');
                    const typeLabel = interview.type === 'online' ? 'Online Video Call' : 'In-Person Meeting';
                    const linkOrLocation = interview.type === 'online'
                        ? `<a href="${interview.meeting_link || '#'}">${interview.meeting_link || 'Link provided by recruiter'}</a>`
                        : 'At our main office';

                    const emailHtml = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Interview Reminder</h1>
              </div>
              <div style="padding: 32px;">
                <p style="font-size: 16px;">Hi <strong>${interview.first_name}</strong>,</p>
                <p style="font-size: 16px;">We're looking forward to speaking with you! This is a quick reminder about your upcoming interview for the <strong>${interview.job_title}</strong> position.</p>

                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Format:</strong> ${typeLabel}</p>
                  <p style="margin: 0;"><strong>Location/Link:</strong> ${linkOrLocation}</p>
                </div>

                <h3 style="color: #4f46e5; margin-top: 24px;">A few quick tips:</h3>
                <ul style="padding-left: 20px;">
                  <li>${interview.type === 'online' ? 'Please test your microphone and camera beforehand.' : 'Please arrive 5-10 minutes early.'}</li>
                  <li>Have a copy of your resume handy.</li>
                  <li>Relax and be yourself!</li>
                </ul>

                <p style="margin-top: 32px;">Best regards,<br>The Hiring Team</p>
              </div>
            </div>
          `;

                    // Send the email
                    await sendEmail({
                        to: interview.email,
                        subject: `Reminder: Your Upcoming Interview for ${interview.job_title}`,
                        html: emailHtml,
                    });

                    // Mark reminder as sent so we don't spam them
                    await run(`UPDATE interviews SET reminder_sent = 1 WHERE id = ?`, [interview.id]);
                    console.log(`✅ Sent 24h reminder for interview ${interview.id} to ${interview.email}`);
                }
            }
        } catch (error) {
            console.error('Error in interview reminder cron:', error);
        }
    });
} 
