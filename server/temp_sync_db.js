import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function sync() {
    console.log('--- Inspecting Database Schema ---');
    
    // 1. Get all tables
    const { data: tables, error: tableErr } = await sb.from('applicants').select('id').limit(1);
    if (tableErr) console.error('Error fetching applicants:', tableErr);

    // Try a more direct approach to find columns
    const checkColumns = async (table) => {
        const { data, error } = await sb.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table ${table}: Could not fetch (might be empty or missing)`);
            return [];
        }
        const cols = Object.keys(data[0] || {});
        console.log(`Table ${table} columns:`, cols);
        return cols;
    };

    const tablesToCheck = ['applicants', 'jobs', 'companies', 'hr_team', 'hr_invitations', 'notifications', 'user_profiles'];
    for (const t of tablesToCheck) {
        await checkColumns(t);
    }
}

sync();
