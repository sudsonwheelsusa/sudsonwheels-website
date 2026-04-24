-- Google Calendar sync fields on profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS google_tokens JSONB,
  ADD COLUMN IF NOT EXISTS google_calendar_id TEXT,
  ADD COLUMN IF NOT EXISTS google_channel_id TEXT,
  ADD COLUMN IF NOT EXISTS google_resource_id TEXT,
  ADD COLUMN IF NOT EXISTS google_channel_expiry BIGINT;

-- Google Calendar event tracking on jobs table
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS gcal_event_id TEXT,
  ADD COLUMN IF NOT EXISTS gcal_synced_at TIMESTAMPTZ;

-- Site settings table (single-row config for business info)
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL DEFAULT 'SudsOnWheels',
  phone TEXT,
  email TEXT,
  address TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default row if table is empty
INSERT INTO site_settings (id, business_name, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'SudsOnWheels', 'contact@sudsonwheelsusa.com')
ON CONFLICT (id) DO NOTHING;

-- RLS for site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin can manage site_settings"
ON site_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
