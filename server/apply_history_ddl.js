import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function runFix() {
    console.log('🚀 Applying History Tables DDL...');
    
    const query = `
        -- 1. Create Login Sessions Table
        CREATE TABLE IF NOT EXISTS user_sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_email TEXT NOT NULL,
          company_id UUID,
          login_time TIMESTAMPTZ DEFAULT now(),
          logout_time TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT now()
        );

        -- 2. Create Activity Logs Table
        CREATE TABLE IF NOT EXISTS hr_activity_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_email TEXT NOT NULL,
          action TEXT NOT NULL,
          company_id UUID,
          created_at TIMESTAMPTZ DEFAULT now()
        );

        -- 3. Create User Profiles Table
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          role TEXT,
          role_title TEXT,
          company_id UUID,
          created_at TIMESTAMPTZ DEFAULT now()
        );

        -- 4. Add Indexes
        CREATE INDEX IF NOT EXISTS idx_sessions_email ON user_sessions(user_email);
        CREATE INDEX IF NOT EXISTS idx_activity_email ON hr_activity_logs(user_email);
    `;
    
    const { data, error } = await sb.rpc('exec_sql', { query });
    
    if (error) {
        console.error('❌ Migration failed:', error);
    } else {
        console.log('✅ Migration Success! Tables created.');
    }
}

runFix();
