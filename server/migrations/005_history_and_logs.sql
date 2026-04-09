-- Migration 005: History and Logs
-- Tracks user sessions and HR actions

CREATE TABLE IF NOT EXISTS user_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email  TEXT NOT NULL,
  company_id  UUID,
  login_time  TIMESTAMPTZ DEFAULT NOW(),
  logout_time TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr_activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email  TEXT NOT NULL,
  company_id  UUID,
  action      TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_email ON user_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_email ON hr_activity_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_sessions_company_id ON user_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_company_id ON hr_activity_logs(company_id);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for internal tracking)
CREATE POLICY "Allow authenticated full access to sessions" ON user_sessions TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access to logs" ON hr_activity_logs TO authenticated USING (true) WITH CHECK (true);
