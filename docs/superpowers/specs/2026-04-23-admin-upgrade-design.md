# Admin Upgrade — Design Spec
**Date:** 2026-04-23  
**Branch:** `feature/admin-upgrade` (from `dev`)  
**Scope:** Three independent but co-shipped features — dashboard UI refresh, Google Calendar two-way sync, TOTP MFA

---

## Overview

The admin portal needs three upgrades:
1. **UI Refresh** — replace generic AI-slab styling with the same brand language used on the marketing site
2. **Google Calendar Sync** — two-way sync between scheduled jobs and `contact@sudsonwheelsusa.com` Google Calendar so the owner sees jobs on their phone and in the portal
3. **TOTP MFA** — second-factor login via authenticator app (Google Authenticator / Authy), built on Supabase MFA

All three ship in a single feature branch. MFA and the UI refresh are contained changes. Google Calendar is the complex piece.

---

## Feature 1 — Dashboard UI Refresh

### Visual Direction
Match the marketing site's design language:
- Off-white (`#FAF6F0`) for all content backgrounds — not `bg-slate-50`
- Small-caps red eyebrow labels: `text-[9px] font-bold uppercase tracking-[0.2em] text-brand-red`
- `font-black` headings in navy, `letter-spacing: -0.02em`
- `border-l-2 border-brand-red` for active nav state — not background highlight blobs
- SVG icons in sidebar nav — no emoji
- `rounded-lg` (not `rounded-2xl`) for cards; `rounded-md` for badges
- Status badges: flat, small, `rounded` not pill-shaped

### Sidebar (`AdminDashboard.tsx`)
- Brand name renders as `Suds<span class="text-brand-red">On</span>Wheels` + "Admin" sub-label, matching footer treatment
- Nav items: SVG icon + label, no emoji, `active` state uses `border-l-2 border-brand-red bg-white/8`
- Section dividers between nav group and footer (same `border-white/10` language as marketing site)

### Overview Section (`OverviewSection.tsx`)
- Stats: single joined bar with internal dividers (`flex` row, `border-r` between items) — not three separate cards
- Each stat has: small-caps label, large `font-black` number, small helper text below (e.g. "needs follow-up")
- New leads count displayed in `text-brand-red` to signal urgency
- Recent activity becomes a proper list/table: columns are Customer, Status, Date, Amount — with header row using small-caps labels

### Leads Pipeline (`LeadsPipeline.tsx`)
- Kanban columns stay (it's useful for the pipeline view) but restyled:
  - Off-white column backgrounds instead of `bg-slate-50`
  - Column header uses small-caps label style
  - Cards use `rounded-lg border border-navy/10 bg-white` — no thick borders or excess radius
  - Status badges: `rounded` not pill, flat color fills matching the pattern from marketing site

### Calendar Section (`CalendarSection.tsx`)
- Restyled grid cells: `bg-white border border-navy/8 rounded-md`
- Today's cell: `border-brand-red`
- Job event chips: `bg-navy text-white rounded-sm` (navy = created from app, blue = edited in Google Calendar)
- Google Calendar connect banner sits above the calendar (see Feature 2)

### Login Form (`AdminLoginForm.tsx`)
- Background page: `bg-offwhite` not `bg-slate-50`
- Card: `bg-white border border-navy/10 rounded-lg` — less rounded than current `rounded-2xl`
- Labels: small-caps tracking style
- Focus rings: `ring-brand-red/30` not `ring-navy/20`
- When MFA is enrolled, form gains a second step (see Feature 3)

---

## Feature 2 — Google Calendar Two-Way Sync

### How It Works
1. Admin clicks "Connect Google Calendar" in the Calendar section
2. OAuth popup → admin signs in as `contact@sudsonwheelsusa.com` → grants Calendar access
3. App receives OAuth tokens; stores `access_token` + `refresh_token` encrypted in `profiles.google_tokens` (JSONB column)
4. From this point: every job create/update/delete triggers a Google Calendar event mutation via the API
5. Google pushes change notifications to a Next.js webhook endpoint; webhook updates the matching job in Supabase

### Is it free?
Yes. Google Calendar API free tier: 1,000,000 requests/day. A pressure washing business will use <100/day. No cost.

### Data Model Changes
```sql
-- Migration: add google_tokens to profiles
ALTER TABLE profiles
  ADD COLUMN google_tokens JSONB,          -- { access_token, refresh_token, expiry_ms }
  ADD COLUMN google_calendar_id TEXT,      -- e.g. "primary" or specific calendar ID
  ADD COLUMN google_channel_id TEXT,       -- push notification channel UUID
  ADD COLUMN google_channel_expiry BIGINT; -- Unix ms, channels expire after ~1 week, must be renewed
```

```sql
-- jobs table: store the Google Calendar event ID and last sync timestamp
ALTER TABLE jobs
  ADD COLUMN gcal_event_id TEXT,
  ADD COLUMN gcal_synced_at TIMESTAMPTZ;   -- used to show "edited in Google Calendar" chip
```

### Google Cloud Setup (one-time, done outside codebase)
1. Create project in Google Cloud Console
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials (Web Application type)
4. Add authorized redirect URI: `https://sudsonwheels.com/api/admin/google/callback` (and localhost for dev)
5. Store `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel env vars

### API Routes
| Route | Purpose |
|---|---|
| `GET /api/admin/google/connect` | Builds OAuth URL, redirects to Google consent screen |
| `GET /api/admin/google/callback` | Receives OAuth code, exchanges for tokens, stores in `profiles`, registers push notification channel |
| `POST /api/admin/google/webhook` | Receives Google push notifications, looks up changed event, updates job in Supabase |
| `DELETE /api/admin/google/disconnect` | Revokes tokens, stops push channel, nulls out `profiles.google_tokens` |

### Job ↔ Calendar Sync Logic
**App → Google (outbound):**
- `jobs` table insert → create Calendar event; store `gcal_event_id` on job
- `jobs` table update (time/title/status change) → update Calendar event
- Job marked done/cancelled → delete Calendar event

**Google → App (inbound via webhook):**
- Webhook receives channel notification (just a ping, no event details)
- App fetches changed event from Google by `gcal_event_id`
- If time changed: update `scheduled_start` / `scheduled_end` on job
- If event deleted in Google: mark job status as `cancelled`

**Token refresh:** Access tokens expire in 1 hour. Before every outbound API call, check `expiry_ms`; if expired, use `refresh_token` to get a new one and update `profiles.google_tokens`.

**Push channel renewal:** Google push channels expire in ≤7 days. A Supabase pg_cron job runs daily, checks `google_channel_expiry`, renews any channel expiring within 24 hours.

### UI Changes (Calendar Section)
- **Disconnected state:** Red-bordered banner — "Connect Google Calendar" button with Google logo
- **Connected state:** Green dot banner — "Connected — contact@sudsonwheelsusa.com · Last synced X ago · Disconnect"
- **Calendar events:** Navy chip = app-created, blue chip = last edited via Google Calendar (use `gcal_synced_at` recency vs `updated_at` to distinguish; if Google webhook updated the job more recently than the app did, show blue)
- **Sync error state:** If webhook fails or token is invalid, show yellow warning banner with "Reconnect" button

---

## Feature 3 — TOTP Multi-Factor Authentication

### Built on Supabase MFA
Supabase Auth has native TOTP support. No extra service, no extra cost.

Key Supabase MFA functions used:
- `supabase.auth.mfa.enroll()` — generates TOTP secret + QR code URI
- `supabase.auth.mfa.challengeAndVerify()` — issues a challenge and verifies the code in one call
- `supabase.auth.mfa.unenroll()` — removes a factor
- `supabase.auth.mfa.listFactors()` — checks if user has MFA enrolled

### Login Flow Changes (`AdminLoginForm.tsx`)
The form becomes a two-step component:
1. **Step 1 (existing):** Email + password + Turnstile → `supabase.auth.signInWithPassword()`
2. If user has MFA enrolled, session is in `AAL1` state (authenticated but not fully verified)
3. **Step 2 (new):** Show 6-digit code input + step progress indicator (2 red dots, first filled)
4. User enters code → `supabase.auth.mfa.challengeAndVerify({ factorId, code })` → session upgrades to `AAL2`
5. On success: redirect to dashboard as before

Step indicator: two `4px` wide colored bars (matching the spec visual) — first red (done), second navy (active).

### MFA Enrollment (Admin Settings)
A new "Settings" section added to the nav (below Gallery). Contains:
- **Security card:** shows MFA status (enrolled / not enrolled)
- If not enrolled: "Enable Authenticator App" button → opens enrollment modal
  - Step 1: Instructions (install app, scan QR)
  - QR code image from `enroll()` response `totp.qr_code`
  - Step 2: Confirm code input → `challengeAndVerify()` → MFA active
- If enrolled: shows "MFA Enabled" + "Remove MFA" button (with confirmation)

### `requireAdmin()` Guard Update
After MFA ships, `requireAdmin()` should verify `AAL2` level:
```ts
// lib/auth/admin.ts — add AAL check after existing profile/role check
const { data: factors } = await supabase.auth.mfa.listFactors();
const hasMfa = (factors?.totp ?? []).some((f) => f.status === 'verified');
if (hasMfa) {
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') {
    redirect('/portal?mfa=required');
  }
}
```
This ensures that even with a valid session cookie, a user who hasn't completed the TOTP step gets bounced back to the login form's step 2.

---

## Architecture — Component & File Map

### New files
| File | Purpose |
|---|---|
| `app/(admin)/portal/dashboard/settings/page.tsx` | New Settings page (MFA management) |
| `components/admin/sections/SettingsSection.tsx` | MFA enrollment UI |
| `components/admin/MfaVerifyStep.tsx` | Step-2 TOTP input used in login form |
| `app/api/admin/google/connect/route.ts` | OAuth redirect |
| `app/api/admin/google/callback/route.ts` | OAuth callback + token storage |
| `app/api/admin/google/webhook/route.ts` | Google push notification receiver |
| `app/api/admin/google/disconnect/route.ts` | Token revocation |
| `lib/google/calendar.ts` | Google Calendar API client (create/update/delete events, refresh tokens) |
| `lib/google/webhook.ts` | Webhook validation + channel registration |
| `supabase/migrations/YYYYMMDD_google_calendar.sql` | Schema changes (google_tokens, gcal_event_id) |

### Modified files
| File | Change |
|---|---|
| `AdminDashboard.tsx` | SVG nav icons, brand name treatment, Settings nav item, off-white bg |
| `AdminLoginForm.tsx` | Two-step MFA flow, brand refresh |
| `OverviewSection.tsx` | Joined stats bar, list-style recent activity |
| `LeadsPipeline.tsx` | Restyled Kanban columns and cards |
| `CalendarSection.tsx` | Google Calendar connect banner, restyled grid, two-tone event chips |
| `lib/auth/admin.ts` | AAL2 check after MFA enrolled |
| `lib/types.ts` | Add `gcal_event_id` to `JobRecord`, `google_tokens` shape |

---

## Error Handling

- **Google token expired:** silently refresh before API calls; if refresh fails, mark connection as broken and show reconnect banner
- **Webhook validation:** verify `X-Goog-Channel-Token` header on all webhook requests; reject unknown channels
- **MFA step fail:** show "Incorrect code, try again" inline — do not sign out, let user retry
- **Calendar sync fail:** log to console, do not block the job save — jobs always save, calendar sync is best-effort

---

## Out of Scope
- Sending Google Calendar invites to customers (customers don't get calendar events)
- Google Meet / video links on calendar events
- Multiple Google accounts
- SMS / email MFA (TOTP only)
- Drag-and-drop rescheduling in the calendar UI
