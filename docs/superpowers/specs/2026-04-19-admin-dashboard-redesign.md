# Admin Dashboard Redesign

**Date:** 2026-04-19  
**Status:** Approved  

## Overview

Redesign the admin dashboard from a single long-scroll page into a sidebar-navigated, tab-structured app with a pipeline-style leads view, .ics calendar integration, quote revision, and an email reply-to fix.

---

## Layout

### Shell

Replace the current single-column layout with a persistent navy sidebar + main content area.

**Sidebar items:**
- Overview
- Leads *(red badge showing count of `new` leads)*
- Calendar
- Services
- Gallery
- Sign Out *(bottom of sidebar)*

Each sidebar item renders a distinct section in the main content area. No sub-routes — all navigation is client-side state within `AdminDashboard`.

The existing header banner (navy block with "Operations Dashboard") is removed. The sidebar replaces it.

---

## Sections

### Overview

Stats strip (same 3 cards as today): New Leads · Quotes Sent · Scheduled Jobs.

Below the stats: a short list of the 5 most recent leads (name, service, status, date) as a quick-glance activity feed.

---

### Leads (Pipeline)

A horizontal Kanban board with five columns:

| Column | Status value | Color accent |
|--------|-------------|--------------|
| New | `new` | neutral |
| Quoted | `quoted` | amber |
| Approved | `approved` | blue |
| Scheduled | `scheduled` | green |
| Done | `scheduled` + marked done* | muted/collapsed |

*"Done" is a UI-only filter. Pipeline column assignment: `completed_at IS NOT NULL` → Done; otherwise use `status`. A lead is moved to Done by the admin clicking "Mark Done" which sets `completed_at = now()` via a new API route (see below). The underlying `status` stays `scheduled`.

**Each card shows:**
- Customer name (bold)
- Service name
- Location + date received
- Quoted amount (if applicable)

**Per-column actions on each card:**

| Column | Actions |
|--------|---------|
| New | Quote · Reject |
| Quoted | Schedule · Revise quote |
| Approved | Schedule |
| Scheduled | Mark Done · Add to My Calendar |
| Done | (read-only, collapsed by default) |

**"Quote" action:** Opens an inline expand on the card with fields: quoted amount, notes. Submits to the existing `POST /api/admin/leads/[leadId]/workflow` with `action: "quote"`.

**"Revise quote" action:** Opens the same inline form pre-filled with the current quoted amount. On submit, calls the existing `POST /api/admin/leads/[leadId]/workflow` with `action: "quote"` and the new amount — this already inserts a new `estimates` row, updates `quoted_amount`, and sends a fresh quote email. No new endpoint needed.

**"Mark Done" action:** Sets `completed_at` timestamp on the lead via a new `PATCH /api/admin/leads/[leadId]` route. Moves the card to the Done column client-side immediately.

**Done column:** Collapsed by default showing only a count badge. "Show all →" expands the full list. Cards in Done are read-only with muted styling.

**Search:** Text input in the section header filters all visible cards across all columns by name, email, phone, service, or address.

---

### Calendar

Keep the existing month-grid calendar view. Enhancements:

- Each job chip on the grid gets an **"+ Calendar"** button that downloads an `.ics` file for that job.
- `.ics` file content: title = job title, start/end = scheduled times, location = address, description = service name + customer name.
- Prev/Next month navigation unchanged.

---

### Services

Exact same UI as today, extracted into its own sidebar section. No functional changes.

---

### Gallery

Exact same UI as today, extracted into its own sidebar section. No functional changes.

---

## Calendar Integration — .ics

### Admin flow
On the Scheduled card: **"Add to My Calendar"** button → `GET /api/admin/jobs/[jobId]/ics` → browser downloads `job-<id>.ics`.

The `.ics` endpoint:
- Auth: requires admin session
- Returns `Content-Type: text/calendar` with `Content-Disposition: attachment; filename="job-<id>.ics"`
- Fields: `SUMMARY`, `DTSTART`, `DTEND`, `LOCATION`, `DESCRIPTION`, `UID`

### Customer flow
When `sendScheduledJobEmail` fires, attach the `.ics` as a Resend email attachment. The customer can tap it in their email app to add the job to their own calendar.

### Google Calendar (future)
Not in this build. OAuth connection via Google Workspace account is a clearly defined next enhancement once the base redesign ships.

---

## Email Fixes

### Reply-to header
Add `replyTo: process.env.OWNER_EMAIL` to every outbound customer email in `lib/email/send.ts`:
- `sendQuoteEmail`
- `sendScheduledJobEmail`
- `sendLeadNotificationEmails` (customer confirmation)

This means when a customer hits Reply on a quote, it lands in `contact@sudsonwheelsusa.com` instead of bouncing off the no-reply address.

### Quote email copy
Change "Reply to this email" → "Reply to this email or give us a call" to make the reply path clear.

---

## Schema Changes

### `leads` table — add `completed_at` column

```sql
alter table public.leads
  add column if not exists completed_at timestamptz;
```

Migration: `supabase/migrations/<timestamp>_leads_completed_at.sql`

No RLS policy changes needed — existing admin policies cover this column.

---

## New API Routes

### `GET /api/admin/jobs/[jobId]/ics`
Returns a `.ics` calendar file for a single job.

- Auth: admin session required
- Reads job from Supabase by `jobId`
- Returns `text/calendar` response

### `PATCH /api/admin/leads/[leadId]`
Partial update for a lead. Used for "Mark Done" (sets `completed_at`).

- Auth: admin session required
- Body: `{ completed_at: string | null }`
- Validated with Zod
- Returns updated lead

---

## Component Architecture

Break `AdminDashboard.tsx` (currently 1082 lines, all in one component) into focused pieces:

```
components/admin/
  AdminShell.tsx          — sidebar + layout wrapper, active section state
  sections/
    OverviewSection.tsx   — stats + recent activity feed
    LeadsPipeline.tsx     — kanban board, search, column rendering
    LeadCard.tsx          — single pipeline card + inline action forms
    CalendarSection.tsx   — month grid + .ics buttons
    ServicesSection.tsx   — service list + add form (extracted from current)
    GallerySection.tsx    — gallery list + upload form (extracted from current)
```

Data loading moves into each section component (each fetches its own data on mount) rather than one monolithic `loadDashboard` call. This prevents a Services change from re-fetching Leads data.

---

## Out of Scope

- Drag-and-drop between Kanban columns (cards move via action buttons only)
- Customer-facing quote approval link / portal
- Google Calendar OAuth sync (flagged as next enhancement)
- Push notifications or SMS
- Multi-admin support
