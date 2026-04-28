-- Make lead_id nullable (direct / contract jobs have no lead)
ALTER TABLE jobs ALTER COLUMN lead_id DROP NOT NULL;

-- Self-referential FK — instance rows point to their series parent
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS parent_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

-- Recurrence rule stored only on the parent row
-- Shape: {"freq":"weekly","interval":1,"days":["sat","sun"],"end_date":"2026-12-31"}
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;

-- Completion tracking
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS units_completed INTEGER,
  ADD COLUMN IF NOT EXISTS rate_per_unit NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(10,2);

CREATE INDEX IF NOT EXISTS jobs_parent_job_id_idx ON jobs(parent_job_id);
