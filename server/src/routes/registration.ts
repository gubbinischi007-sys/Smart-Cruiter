import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

router.post('/confirm', async (req, res) => {
  const { email, trackingId, companyName } = req.body;
  
  if (!email || !trackingId || !companyName) {
    return res.status(400).json({ error: 'Missing required information' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"SmartRecruiter" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Registration Tracking ID: ${companyName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 2px solid #6366f1; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #6366f1; margin-bottom: 20px;">Registration Submitted!</h2>
          <p>Hello,</p>
          <p>We have successfully received your company registration application for <strong>${companyName}</strong>.</p>
          <p>Your unique application Tracking ID is:</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px dashed #6366f1; text-align: center; margin: 20px 0;">
            <code style="font-size: 24px; font-weight: bold; color: #4f46e5; letter-spacing: 2px;">${trackingId}</code>
          </div>
          <p><strong>What's next?</strong></p>
          <ul>
            <li>Our team will verify your document (review time: 5-7 business days).</li>
            <li>Once approved, you can use this Tracking ID to log in and set up your workspace.</li>
          </ul>
          <p style="margin-top: 30px; font-size: 14px; color: #64748b;">If you have any questions, please reply to this email.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="text-align: center; font-size: 12px; color: #94a3b8;">© 2026 SmartRecruiter Platform</p>
        </div>
      `
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Registration Email Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export const registrationRoutes = router;
