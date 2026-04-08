import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

import { v4 as uuidv4 } from 'uuid';
import { run } from '../database.js';

export async function sendEmail(options: EmailOptions): Promise<void> {
  // Always log the "email" to the database as a notification for the candidate
  try {
    const id = uuidv4();
    await run(
      `INSERT INTO notifications (id, recipient_email, subject, message, type, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, options.to, options.subject, options.html, 'email', new Date().toISOString()]
    );
    console.log(`Notification saved for ${options.to}`);
  } catch (dbError) {
    console.error('Failed to save notification:', dbError);
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Configuration: Email credentials missing. Email simulated.');
    console.log('Would send email:', options);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error(`Failed to send email to ${options.to}:`, error);
    throw error;
  }
}

export interface BulkEmailResult {
  successful: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

export async function sendBulkEmails<T>(
  recipients: T[],
  type: string,
  getEmailOptions: (recipient: T) => Omit<EmailOptions, 'to'>
): Promise<BulkEmailResult> {
  const result: BulkEmailResult = {
    successful: 0,
    failed: 0,
    errors: [],
  };

  if (recipients.length === 0) return result;

  const emailPromises = recipients.map(async (recipient) => {
    const emailOptions = getEmailOptions(recipient);
    const recipientEmail = (recipient as any).email;

    if (!recipientEmail) {
      throw new Error('No email address found');
    }

    return sendEmail({
      ...emailOptions,
      to: recipientEmail,
    });
  });

  const results = await Promise.allSettled(emailPromises);

  results.forEach((res, index) => {
    if (res.status === 'fulfilled') {
      result.successful++;
    } else {
      result.failed++;
      result.errors.push({
        email: (recipients[index] as any).email || 'unknown',
        error: res.reason?.message || 'Unknown error',
      });
    }
  });

  return result;
}

