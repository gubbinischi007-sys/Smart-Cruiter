import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
    const { data, error } = await sb.rpc('get_table_columns', { table_name: 'applicants' });
    if (error) {
        // Fallback: Just try to select one row and see the keys
        const { data: row, error: err2 } = await sb.from('applicants').select('*').limit(1);
        if (err2) console.error(err2);
        else console.log('Columns:', Object.keys(row[0] || {}));
    } else {
        console.log('Columns:', data);
    }
}

check();
