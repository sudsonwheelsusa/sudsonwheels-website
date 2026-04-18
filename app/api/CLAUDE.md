# Backend (app/api + lib/supabase)

## Route Handlers

Every public route handler:
1. Parses body with Zod schema — reject invalid input with 400
2. Verifies Turnstile token (if from public form) — reject failed verification with 403
3. Checks Upstash rate limit — reject over-limit with 429
4. Uses service role Supabase client for the actual write
5. Returns structured JSON response

Every admin route handler:
1. Verifies authenticated session via Supabase
2. Confirms user has admin role (check `profiles.role = 'admin'`)
3. Uses service role client for the operation
4. Returns structured JSON response

## Supabase Clients

Three clients in `lib/supabase/`:

- `browser.ts` — `createBrowserClient` for client components. Uses anon key. Enforces RLS.
- `server.ts` — `createServerClient` for RSC and route handlers where user context matters. Uses anon key with user's session.
- `admin.ts` — `createClient` with service role key. Server-only. Use for operations that bypass RLS (admin writes, webhook handlers, background jobs).

Never import `admin.ts` into a client component. Put `import "server-only"` at the top of server-only modules as a safety net.

## RLS Policies

Default deny on every table. Open specifically:

```sql
-- Example: leads table
alter table leads enable row level security;

-- Anon can insert a lead (public contact form)
create policy "anon can insert leads"
on leads for insert
to anon
with check (true);

-- Only authenticated admin can select/update leads
create policy "admin can select leads"
on leads for select
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
```

Test every policy with both keys before merging.

## Email Sending

Use Resend via a shared helper in `lib/email/send.ts`. Templates live in `lib/email/templates/` as React Email components.

Two emails per lead submission:
1. Notification to owner — all lead fields + deep link to /admin/leads/[id]
2. Confirmation to customer — generic "we got your request" message

Always wrap sends in try/catch. If email fails, still return success to the client — the lead is saved. Log the email failure to Sentry (once wired).

## Migrations

All schema changes in `supabase/migrations/`. Naming: `YYYYMMDDHHMMSS_description.sql`. Use the Supabase CLI:

```
supabase migration new add_leads_table
supabase db push
```

Never edit existing migrations — always create new ones for changes.

## Do Not

- Don't use service role key for read operations that should respect RLS
- Don't write business logic that depends on the service role key bypassing RLS — RLS is part of the correctness model
- Don't return raw Supabase error messages to the client — map to user-safe messages
- Don't skip input validation because "the database will catch it"
- Don't send emails synchronously in the request handler if it blocks the response meaningfully — fire and forget with `.catch()` for logging
