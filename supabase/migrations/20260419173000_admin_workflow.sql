create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null,
  detail text not null,
  before_image_path text,
  after_image_path text,
  before_label text,
  after_label text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'service'
  ) then
    alter table public.leads rename column service to service_name;
  end if;
end $$;

alter table public.leads
  add column if not exists service_id uuid references public.services (id) on delete set null,
  add column if not exists location_address text,
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision,
  add column if not exists status text not null default 'new' check (status in ('new', 'approved', 'rejected', 'quoted', 'scheduled')),
  add column if not exists internal_notes text,
  add column if not exists quoted_amount numeric(10, 2),
  add column if not exists estimate_sent_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists scheduled_job_id uuid;

create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  amount numeric(10, 2) not null,
  notes text,
  status text not null default 'sent' check (status in ('draft', 'sent', 'accepted', 'rejected')),
  created_by uuid references public.profiles (id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  estimate_id uuid references public.estimates (id) on delete set null,
  title text not null,
  status text not null default 'scheduled' check (status in ('pending', 'scheduled', 'completed', 'cancelled')),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz,
  service_name text not null,
  customer_name text not null,
  location_address text,
  location_lat double precision,
  location_lng double precision,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.leads
  add constraint leads_scheduled_job_fk
  foreign key (scheduled_job_id) references public.jobs (id) on delete set null;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_sync_profile on auth.users;
create trigger on_auth_user_created_sync_profile
after insert or update of email on auth.users
for each row execute function public.sync_profile_from_auth_user();

insert into public.profiles (id, email)
select id, email
from auth.users
on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user_id
      and role = 'admin'
  );
$$;

create unique index if not exists only_one_admin_role_idx
on public.profiles (role)
where role = 'admin';

insert into public.services (name, description, icon, sort_order)
values
  ('House & Siding', 'Remove dirt, mold, and mildew from your home''s exterior. Safe for vinyl, wood, and brick.', 'House', 1),
  ('Driveways & Concrete', 'Strip stains, oil, and grime from concrete and paver surfaces. Looks like new.', 'Droplets', 2),
  ('Decks & Fences', 'Prep your deck or fence for staining, or just restore it to its natural color.', 'Trees', 3),
  ('Gutters', 'Flush debris and built-up grime from your gutters and downspouts.', 'ArrowDownToLine', 4),
  ('Fleet Washing', 'Keep your commercial vehicles looking sharp. We come to your lot on a schedule.', 'Truck', 5),
  ('Roof Soft Wash', 'Low-pressure treatment to safely remove algae and staining from shingles.', 'Home', 6)
on conflict (name) do update
set description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order;

update public.leads
set service_id = services.id
from public.services
where public.leads.service_name = services.name
  and public.leads.service_id is null;

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists services_sort_order_idx on public.services (sort_order);
create index if not exists gallery_items_sort_order_idx on public.gallery_items (sort_order);
create index if not exists jobs_scheduled_start_idx on public.jobs (scheduled_start);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery',
  'gallery',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.gallery_items enable row level security;
alter table public.estimates enable row level security;
alter table public.jobs enable row level security;

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "admins can update profiles" on public.profiles;
create policy "admins can update profiles"
on public.profiles
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "public can read services" on public.services;
create policy "public can read services"
on public.services
for select
to public
using (is_active = true or public.is_admin(auth.uid()));

drop policy if exists "admins can manage services" on public.services;
create policy "admins can manage services"
on public.services
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "public can read gallery items" on public.gallery_items;
create policy "public can read gallery items"
on public.gallery_items
for select
to public
using (is_active = true or public.is_admin(auth.uid()));

drop policy if exists "admins can manage gallery items" on public.gallery_items;
create policy "admins can manage gallery items"
on public.gallery_items
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "admin can select leads" on public.leads;
create policy "admin can select leads"
on public.leads
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "admin can update leads" on public.leads;
create policy "admin can update leads"
on public.leads
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "admin can delete leads" on public.leads;
create policy "admin can delete leads"
on public.leads
for delete
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "admin can read estimates" on public.estimates;
create policy "admin can read estimates"
on public.estimates
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "admin can manage estimates" on public.estimates;
create policy "admin can manage estimates"
on public.estimates
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "admin can read jobs" on public.jobs;
create policy "admin can read jobs"
on public.jobs
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "admin can manage jobs" on public.jobs;
create policy "admin can manage jobs"
on public.jobs
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "public can read gallery bucket" on storage.objects;
create policy "public can read gallery bucket"
on storage.objects
for select
to public
using (bucket_id = 'gallery');

drop policy if exists "admins can upload gallery bucket" on storage.objects;
create policy "admins can upload gallery bucket"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'gallery'
  and public.is_admin(auth.uid())
);

drop policy if exists "admins can update gallery bucket" on storage.objects;
create policy "admins can update gallery bucket"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'gallery'
  and public.is_admin(auth.uid())
)
with check (
  bucket_id = 'gallery'
  and public.is_admin(auth.uid())
);

drop policy if exists "admins can delete gallery bucket" on storage.objects;
create policy "admins can delete gallery bucket"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'gallery'
  and public.is_admin(auth.uid())
);
