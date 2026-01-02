import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
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

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email not configured. Skipping email send.');
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

  for (const recipient of recipients) {
    try {
      const emailOptions = getEmailOptions(recipient);
      const recipientEmail = (recipient as any).email;

      if (!recipientEmail) {
        result.failed++;
        result.errors.push({
          email: 'unknown',
          error: 'No email address found',
        });
        continue;
      }

      await sendEmail({
        ...emailOptions,
        to: recipientEmail,
      });

      result.successful++;
    } catch (error: any) {
      result.failed++;
      result.errors.push({
        email: (recipient as any).email || 'unknown',
        error: error.message || 'Unknown error',
      });
    }
  }

  return result;
}

