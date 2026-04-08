import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

router.post('/send', async (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(200).json({ error: 'Missing data' });
  }

  const targetEmail = email.toLowerCase().trim();

  try {
    // SECURE SETUP: Reading from .env file
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"SmartRecruiter" <${process.env.EMAIL_USER}>`,
      to: targetEmail,
      subject: 'Verification Code',
      text: `Your code is: ${otp}`,
      html: `<h1>Verification Code</h1><p>Your code is: <strong>${otp}</strong></p>`
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('SERVER ERROR:', error);
    return res.status(200).json({ error: error.message || 'Failed' });
  }
});

export const otpRoutes = router;
