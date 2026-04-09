-- MASTER DATABASE SYNC MIGRATION
-- Copy and paste this into your Supabase SQL Editor to ensure the database matches the project code perfectly.

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. JOBS TABLE (Ensure schema)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID,
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  type TEXT,
  description TEXT,
  requirements TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. APPLICANTS TABLE ENHANCEMENTS
-- Ensure basic columns exist
CREATE TABLE IF NOT EXISTS applicants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  stage TEXT DEFAULT 'applied',
  status TEXT DEFAULT 'active',
  applied_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS resume_text TEXT;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS offer_sent_at TIMESTAMPTZ;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS offer_status TEXT;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS offer_notes TEXT;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS offer_salary TEXT;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS offer_joining_date TEXT;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS offer_rules TEXT;

-- 3. INTERVIEWS TABLE
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  type TEXT DEFAULT 'online',
  meeting_link TEXT,
  notes TEXT,
  status TEXT DEFAULT 'scheduled',
  rating INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CANDIDATE REFERENCES
CREATE TABLE IF NOT EXISTS candidate_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  ref_name TEXT NOT NULL,
  ref_email TEXT NOT NULL,
  relationship TEXT,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  responses TEXT, -- JSON string
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id UUID,
  company_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  job_title TEXT,
  department TEXT,
  hired_date TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. APPLICATION HISTORY
CREATE TABLE IF NOT EXISTS application_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT,
  job_title TEXT,
  status TEXT,
  reason TEXT,
  company_id UUID,
  date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_app_history_company ON application_history(company_id);

-- 7. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT,
  subject TEXT,
  message TEXT,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. COMPANIES (Ensure schema)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  owner_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS about_us TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS brand_color TEXT;

-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_applicants_job_id ON applicants(job_id);
CREATE INDEX IF NOT EXISTS idx_applicants_email ON applicants(email);
CREATE INDEX IF NOT EXISTS idx_interviews_applicant ON interviews(applicant_id);
CREATE INDEX IF NOT EXISTS idx_references_token ON candidate_references(token);

-- 10. HISTORY AND LOGS
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  company_id UUID,
  login_time TIMESTAMPTZ DEFAULT now(),
  logout_time TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  company_id UUID,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_email ON user_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_activity_email ON hr_activity_logs(user_email);

-- SUMMARY: This migration ensures all tables used in the project exist in Supabase with correct columns.
