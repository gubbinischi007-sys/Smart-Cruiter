import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function optimize() {
    console.log('⚡ Starting Database Optimization...');

    const indexes = [
        // APPLICANTS
        'CREATE INDEX IF NOT EXISTS idx_applicants_job_id ON applicants(job_id)',
        'CREATE INDEX IF NOT EXISTS idx_applicants_email ON applicants(email)',
        'CREATE INDEX IF NOT EXISTS idx_applicants_stage ON applicants(stage)',
        'CREATE INDEX IF NOT EXISTS idx_applicants_status ON applicants(status)',
        
        // JOBS
        'CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id)',
        'CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)',
        'CREATE INDEX IF NOT EXISTS idx_jobs_department ON jobs(department)',

        // EMPLOYEES
        'CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id)',
        'CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email)',

        // INTERVIEWS
        'CREATE INDEX IF NOT EXISTS idx_interviews_applicant_id ON interviews(applicant_id)',
        'CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id)',
        'CREATE INDEX IF NOT EXISTS idx_interviews_company_id ON interviews(company_id)',
    ];

    for (const sql of indexes) {
        console.log(`Applying: ${sql.split(' ')[4]}...`);
        const { error } = await sb.rpc('exec_sql', { query: sql });
        if (error) console.error(`❌ Failed:`, error.message);
    }

    console.log('🚀 Database Optimization Complete! Queries will now be significantly faster.');
}

optimize();
