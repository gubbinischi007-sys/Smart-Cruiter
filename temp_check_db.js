const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://eluarxdyxvxwknylejaj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsdWFyeGR5eHZ4d2tueWxlamFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg5ODU5NiwiZXhwIjoyMDg3NDc0NTk2fQ.7RK3EqTtOlOrS4KNqttdmFb6mhuDp99bAKyKywphFXE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkData() {
    console.log('--- Checking Applicants Table ---');
    const { data: applicants, error: appError } = await supabase.from('applicants').select('*');
    if (appError) {
        console.error('Error fetching applicants:', appError);
    } else {
        console.log(`Total Applicants: ${applicants.length}`);
        applicants.forEach(a => console.log(`- ${a.first_name} ${a.last_name} (${a.email}) | Job: ${a.job_id}`));
    }

    console.log('\n--- Checking Companies Table ---');
    const { data: companies, error: compError } = await supabase.from('companies').select('*');
    if (compError) {
        console.error('Error fetching companies:', compError);
    } else {
        console.log(`Total Companies: ${companies.length}`);
        companies.forEach(c => console.log(`- ${c.name} (${c.email}) | Status: ${c.status}`));
    }
}

checkData();
