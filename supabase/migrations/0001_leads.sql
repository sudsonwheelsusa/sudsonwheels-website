-- Create leads table
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null,
  last_name   text not null,
  phone       text not null,
  email       text not null,
  service     text not null,
  message     text,
  created_at  timestamptz not null default now()
);

-- Enable RLS (anon cannot read leads — only service role / dashboard)
alter table public.leads enable row level security;

-- Anon can insert (submit a lead), but cannot read
create policy "anon can insert leads"
  on public.leads
  for insert
  to anon
  with check (true);
