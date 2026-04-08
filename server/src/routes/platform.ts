import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { run, all, get } from '../database.js';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Middleware to check for platform admin role (simplified for now, using a header)
const isPlatformAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const role = req.headers['x-user-role'];
  if (role === 'super_admin') {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized. Platform Admin only.' });
  }
};

// Get all companies pending verification or filtered by status
router.get('/companies', isPlatformAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase.from('companies').select('*');

    if (status) {
      query = query.eq('status', status);
    }

    const { data: companies, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Verify a company
router.post('/companies/:id/verify', isPlatformAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const { data: company, error: fetchError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const { error: updateError } = await supabase
      .from('companies')
      .update({ status })
      .eq('id', id);
    
    if (updateError) throw updateError;
    
    res.json({ message: `Company ${status} successfully` });
  } catch (error) {
    console.error('Error verifying company:', error);
    res.status(500).json({ error: 'Failed to verify company' });
  }
});

// Get status for a specific company by email
router.get('/status', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // 1. Find user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('company_id, email, role, id')
      .eq('email', email)
      .single();

    if (profileError || !profile?.company_id) {
      console.warn(`[Platform] No company linked for user: ${email}`);
      return res.status(404).json({ error: 'Company link not found for this user' });
    }

    // 2. Fetch the current linked company
    let { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single();

    if (companyError || !company) {
      console.error(`[Platform] Linked company not found: ${profile.company_id}`);
      return res.status(404).json({ error: 'Company not found' });
    }

    // 3. SMART AUTO-LINK LOGIC: 
    // If current company isn't approved, but another company with the SAME name IS approved:
    // This happens if a user registered a company but their profile got linked to a dummy record first.
    if (company.status?.toLowerCase() !== 'approved') {
      const { data: approvedMatch } = await supabase
        .from('companies')
        .select('*')
        .eq('name', company.name)
        .eq('status', 'approved')
        .maybeSingle();

      if (approvedMatch && approvedMatch.id !== company.id) {
        console.log(`[Platform SmartLink] Migrating user ${email} from ${company.id} to Approved company ${approvedMatch.id} (${approvedMatch.name})`);
        
        // Relink the user profile to the correct approved record
        const { error: patchError } = await supabase
          .from('user_profiles')
          .update({ company_id: approvedMatch.id })
          .eq('id', profile.id);

        if (!patchError) {
          company = approvedMatch; // Return the approved one instead!
        }
      }
    }

    console.log(`[Platform Status] User: ${email}, Company: ${company.name}, Status: ${company.status}`);
    res.json(company);
  } catch (error) {
    console.error('Error fetching company status:', error);
    res.status(500).json({ error: 'Failed to fetch company status' });
  }
});

export default router;
