-- supabase/migrations/20260419200000_leads_completed_at.sql
alter table public.leads
  add column if not exists completed_at timestamptz;

create index if not exists leads_completed_at_idx
  on public.leads (completed_at)
  where completed_at is not null;
