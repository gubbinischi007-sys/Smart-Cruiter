import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Middleware: only authenticated HR users can call these endpoints
// (company-id header scopes every query to the correct company)
const isMasterAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const role = req.headers['x-user-role'];
  if (role === 'hr') return next();
  res.status(403).json({ error: 'Unauthorized. Master Admin only.' });
};

// ── GET /hr-team — list all HR users for this company ──────────────────────
// Status is derived from Supabase Auth ban_duration (no status column needed)
router.get('/', isMasterAdmin, async (req, res) => {
  const companyId = req.headers['x-company-id'] as string;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required.' });

  try {
    // 1. Get the company owner_id so we can exclude them from the list
    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .select('owner_id')
      .eq('id', companyId)
      .single();

    if (companyErr) throw companyErr;
    const ownerId = company?.owner_id;

    // 2. Fetch HR profiles for this company, excluding the owner
    let query = supabase
      .from('user_profiles')
      .select('id, name, email, role_title, created_at')
      .eq('company_id', companyId)
      .eq('role', 'hr')
      .order('created_at', { ascending: false });

    if (ownerId) {
      query = query.neq('id', ownerId);
    }

    const { data: profiles, error: profileErr } = await query;

    if (profileErr) throw profileErr;
    if (!profiles || profiles.length === 0) return res.json([]);

    // 3. Fetch all auth users to cross-reference ban status
    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    if (authErr) throw authErr;

    const authMap = new Map(
      (authData?.users || []).map((u: any) => [u.id, u])
    );

    // 4. Merge: derive status from banned_until
    const enriched = profiles.map((p: any) => {
      const authUser = authMap.get(p.id) as any;
      const bannedUntil = authUser?.banned_until;
      const isSuspended = bannedUntil && new Date(bannedUntil) > new Date();
      return {
        ...p,
        status: isSuspended ? 'suspended' : 'active',
      };
    });

    res.json(enriched);
  } catch (err: any) {
    console.error('Error fetching HR team:', err);
    res.status(500).json({ error: 'Failed to fetch HR team.' });
  }
});


// ── POST /hr-team — Master Admin creates a new HR account ─────────────────
router.post('/', isMasterAdmin, async (req, res) => {
  const companyId = req.headers['x-company-id'] as string;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required.' });

  const { name, email, password, role_title } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    // 1. Create auth user via service role (bypasses email confirmation)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        name: name.trim(),
        role: 'hr',
        role_title: role_title?.trim() || '',
      },
    });

    if (authError) {
      if (
        authError.message.includes('already been registered') ||
        authError.message.includes('already exists')
      ) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
      throw authError;
    }

    if (!authData.user) throw new Error('User creation failed.');

    // 2. Upsert into user_profiles (a DB trigger may have already created the row)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: authData.user.id,
          email: email.trim().toLowerCase(),
          name: name.trim(),
          role: 'hr',
          role_title: role_title?.trim() || '',
          company_id: companyId,
        },
        { onConflict: 'id' }
      );

    if (profileError) throw profileError;

    res.status(201).json({
      id: authData.user.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role_title: role_title?.trim() || '',
      status: 'active',
      created_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error creating HR account:', err);
    res.status(500).json({ error: err?.message || 'Failed to create HR account.' });
  }
});

// ── PATCH /hr-team/:id/suspend — suspend an HR member ────────────────────
router.patch('/:id/suspend', isMasterAdmin, async (req, res) => {
  const { id } = req.params;
  const companyId = req.headers['x-company-id'] as string;

  try {
    // Verify user belongs to this company first
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('id, name')
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (profileErr || !profile) return res.status(404).json({ error: 'HR member not found.' });

    // Ban via auth (blocks sign-in) — 10-year ban = effectively permanent
    const { error: banError } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: '87600h',
    });
    if (banError) throw banError;

    res.json({ message: `${profile.name} has been suspended.` });
  } catch (err: any) {
    console.error('Error suspending HR member:', err);
    res.status(500).json({ error: err?.message || 'Failed to suspend HR member.' });
  }
});

// ── PATCH /hr-team/:id/reactivate — reactivate a suspended HR member ─────
router.patch('/:id/reactivate', isMasterAdmin, async (req, res) => {
  const { id } = req.params;
  const companyId = req.headers['x-company-id'] as string;

  try {
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('id, name')
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (profileErr || !profile) return res.status(404).json({ error: 'HR member not found.' });

    // Remove ban entirely
    const { error: unbanError } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: 'none',
    });
    if (unbanError) throw unbanError;

    res.json({ message: `${profile.name} has been reactivated.` });
  } catch (err: any) {
    console.error('Error reactivating HR member:', err);
    res.status(500).json({ error: err?.message || 'Failed to reactivate HR member.' });
  }
});

// ── DELETE /hr-team/:id — permanently delete an HR account ───────────────
router.delete('/:id', isMasterAdmin, async (req, res) => {
  const { id } = req.params;
  const companyId = req.headers['x-company-id'] as string;

  try {
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('id, name')
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (profileErr || !profile) return res.status(404).json({ error: 'HR member not found.' });

    // Delete from auth — profile row will cascade or we clean it up manually
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(id);
    if (deleteAuthError) throw deleteAuthError;

    await supabase.from('user_profiles').delete().eq('id', id);

    res.json({ message: `${profile.name} has been permanently deleted.` });
  } catch (err: any) {
    console.error('Error deleting HR member:', err);
    res.status(500).json({ error: err?.message || 'Failed to delete HR member.' });
  }
});

export default router;
