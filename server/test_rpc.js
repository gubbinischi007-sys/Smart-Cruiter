import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testRpc() {
    console.log('Testing RPC exec_sql...');
    const query = `ALTER TABLE applicants ADD COLUMN IF NOT EXISTS resume_text TEXT;
                   ALTER TABLE applicants ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
                   ALTER TABLE companies ADD COLUMN IF NOT EXISTS about_us TEXT;
                   ALTER TABLE companies ADD COLUMN IF NOT EXISTS brand_color TEXT;`;
    
    const { data, error } = await sb.rpc('exec_sql', { query });
    
    if (error) {
        console.error('RPC failed:', error);
        console.log('--- Attempting fallback via direct Table check ---');
        // If RPC doesn't exist, we can't do it.
    } else {
        console.log('RPC Success! Data:', data);
    }
}

testRpc();
