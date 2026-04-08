import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function migrate() {
    console.log('⚡ Adding Score Column to Applicants...');

    const scripts = [
        'ALTER TABLE applicants ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0',
        'CREATE INDEX IF NOT EXISTS idx_applicants_score ON applicants(score)'
    ];

    for (const sql of scripts) {
        console.log(`Executing: ${sql}...`);
        const { error } = await sb.rpc('exec_sql', { query: sql });
        if (error) {
           if (error.message.includes('already exists')) {
               console.log('✅ Column already exists.');
           } else {
               console.error(`❌ Failed:`, error.message);
           }
        }
    }

    console.log('🚀 Migration Complete!');
}

migrate();
