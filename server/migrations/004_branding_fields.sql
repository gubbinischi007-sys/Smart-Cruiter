-- Add company branding fields
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS about_us TEXT,
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#6366f1';
