import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase.js';
import { sendEmail } from '../services/email.js';

const router = express.Router();

// Middleware: only Master Admin can send invites
const isMasterAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const role = req.headers['x-user-role'];
  if (role === 'hr') return next();
  res.status(403).json({ error: 'Unauthorized. Master Admin only.' });
};

// ── POST /api/hr-invites/send ──────────────────────────────────────────────
router.post('/send', isMasterAdmin, async (req, res) => {
  const companyId = req.headers['x-company-id'] as string;
  const { email, role_title } = req.body;

  if (!companyId || !email) {
    return res.status(400).json({ error: 'Email and Company ID are required.' });
  }

  try {
    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email already exists in the system.' });
    }

    // 2. Generate unique token
    const token = uuidv4();
    
    // 3. Save invitation to DB
    const { error: inviteErr } = await supabase
      .from('hr_invitations')
      .insert({
        company_id: companyId,
        email: email.trim().toLowerCase(),
        role_title: role_title?.trim() || '',
        token,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      });

    if (inviteErr) throw inviteErr;

    // 4. Get company name for the email
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    // 5. Send Email via central service
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${token}`;

    await sendEmail({
      to: email,
      subject: `Invitation to join ${company?.name || 'SmartRecruiter'}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #6366f1;">You're Invited!</h2>
          <p>Hello,</p>
          <p>You have been invited to join the recruitment team at <strong>${company?.name || 'your organization'}</strong> on SmartRecruiter.</p>
          <div style="margin: 30px 0;">
            <a href="${inviteLink}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Accept Invitation & Setup Account
            </a>
          </div>
          <p style="font-size: 14px; color: #64748b;">This link will expire in 7 days.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="font-size: 12px; color: #94a3b8;">If you were not expecting this invitation, you can safely ignore this email.</p>
        </div>
      `
    });

    res.json({ message: 'Invitation sent successfully!' });
  } catch (err: any) {
    console.error('Error sending invite:', err);
    res.status(500).json({ error: 'Failed to send invitation. Please try again.' });
  }
});

// ── GET /api/hr-invites/verify/:token ────────────────────────────────────────
router.get('/verify/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const { data: invite, error } = await supabase
      .from('hr_invitations')
      .select('*, companies(name)')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (error || !invite) {
      return res.status(404).json({ error: 'Invalid or expired invitation token.' });
    }

    // Check expiration
    if (new Date(invite.expires_at) < new Date()) {
        return res.status(410).json({ error: 'This invitation has expired.' });
    }

    res.json(invite);
  } catch (err: any) {
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// ── POST /api/hr-invites/accept ──────────────────────────────────────────────
router.post('/accept', async (req, res) => {
  const { token, name, password } = req.body;

  try {
    // 1. Get invite
    const { data: invite, error: fetchErr } = await supabase
      .from('hr_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (fetchErr || !invite) return res.status(400).json({ error: 'Invite not found.' });

    // 2. Create Auth User
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'hr' }
    });

    if (authErr) throw authErr;

    // 3. Create User Profile
    const { error: profileErr } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: invite.email,
        name,
        role: 'hr',
        role_title: invite.role_title,
        company_id: invite.company_id
      });

    if (profileErr) throw profileErr;

    // 4. Mark invite as accepted
    await supabase.from('hr_invitations').update({ status: 'accepted' }).eq('id', invite.id);

    res.json({ message: 'Account created successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
