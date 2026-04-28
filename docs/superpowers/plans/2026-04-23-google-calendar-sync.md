# Google Calendar Two-Way Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a job is scheduled in the admin portal, it automatically appears in the `contact@sudsonwheelsusa.com` Google Calendar. When the admin reschedules or deletes that calendar event on their phone, the job in the portal updates to match.

**Architecture:** OAuth2 flow stores `contact@sudsonwheelsusa.com` Google tokens in the admin's `profiles` row. A `lib/google/calendar.ts` module handles all Google API calls. Job scheduling triggers a fire-and-forget calendar event creation. Google push notifications hit a webhook route that updates the matching job. Push channel is renewed lazily in the status route. All Google sync is best-effort — it never blocks job saves.

**Tech Stack:** Google Calendar API (raw fetch — no googleapis package), Next.js 15 App Router API routes, Supabase Postgres, Tailwind CSS v4.

**Prerequisites:**
- Complete the UI refresh plan first (restyled CalendarSection)
- Set these environment variables in `.env.local` AND Vercel before testing:
  - `GOOGLE_CLIENT_ID` — from Google Cloud Console OAuth credentials
  - `GOOGLE_CLIENT_SECRET` — from Google Cloud Console OAuth credentials
  - `GOOGLE_WEBHOOK_SECRET` — any random string, e.g. `openssl rand -hex 32`
  - `NEXT_PUBLIC_BASE_URL` — `https://sudsonwheelsusa.com` in prod, `https://your-ngrok-url.ngrok.io` for local webhook testing

**Google Cloud Setup (do this before Task 3):**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project called "SudsOnWheels"
3. Enable **Google Calendar API** (APIs & Services → Library → search "Google Calendar API")
4. Go to APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
5. Application type: **Web application**
6. Authorized redirect URIs: add `https://sudsonwheelsusa.com/api/admin/google/callback` and `http://localhost:3000/api/admin/google/callback`
7. Copy the Client ID and Client Secret into your env vars

---

### Task 1: Database migration + update lib/types.ts

**Files:**
- Create: `supabase/migrations/20260423120000_google_calendar.sql`
- Modify: `lib/types.ts`

- [ ] **Step 1: Create the migration**

Create `supabase/migrations/20260423120000_google_calendar.sql`:

```sql
-- Add Google Calendar sync fields to profiles (admin account)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS google_tokens JSONB,
  ADD COLUMN IF NOT EXISTS google_calendar_id TEXT,
  ADD COLUMN IF NOT EXISTS google_channel_id TEXT,
  ADD COLUMN IF NOT EXISTS google_resource_id TEXT,
  ADD COLUMN IF NOT EXISTS google_channel_expiry BIGINT;

-- Add Google Calendar event tracking to jobs
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS gcal_event_id TEXT,
  ADD COLUMN IF NOT EXISTS gcal_synced_at TIMESTAMPTZ;

-- RLS: google_tokens is sensitive — only the owning admin can read their own row
-- (profiles already has RLS; this adds no new policies since the admin client bypasses RLS)
-- Webhook route uses service role client so it can update any job by gcal_event_id
```

- [ ] **Step 2: Run the migration**

```bash
npx supabase db push
```

Expected output: `Applying migration 20260423120000_google_calendar.sql... done`

If you get a "column already exists" error, the `IF NOT EXISTS` guards should prevent that — double-check the SQL.

- [ ] **Step 3: Update lib/types.ts**

Open `lib/types.ts`. Add the two new fields to `JobRecord` (after `created_at`):

```ts
export interface JobRecord {
  id: string;
  lead_id: string;
  estimate_id: string | null;
  title: string;
  status: "pending" | "scheduled" | "completed" | "cancelled";
  scheduled_start: string;
  scheduled_end: string | null;
  service_name: string;
  customer_name: string;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  gcal_event_id: string | null;
  gcal_synced_at: string | null;
}
```

Also add a `GoogleTokens` interface at the bottom of the file:

```ts
export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expiry_ms: number;
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260423120000_google_calendar.sql lib/types.ts
git commit -m "feat(gcal): add db columns for Google Calendar sync and gcal fields to JobRecord"
```

---

### Task 2: Create the Google Calendar API client

**Files:**
- Create: `lib/google/calendar.ts`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p lib/google
```

Create `lib/google/calendar.ts`:

```ts
import "server-only";

import type { GoogleTokens } from "@/lib/types";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export interface CalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
}

export interface CalendarEventResult {
  id: string;
  summary: string;
  status: string;
  start: { dateTime: string };
  end: { dateTime: string };
  updated: string;
}

// Refresh access token using the stored refresh token.
// Returns updated tokens with new access_token and expiry_ms.
async function refreshTokens(tokens: GoogleTokens): Promise<GoogleTokens> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token refresh failed: ${err}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  return {
    ...tokens,
    access_token: data.access_token,
    expiry_ms: Date.now() + data.expires_in * 1000 - 60_000, // 1-min buffer
  };
}

// Returns valid tokens, refreshing if expired.
export async function getValidTokens(tokens: GoogleTokens): Promise<GoogleTokens> {
  if (Date.now() < tokens.expiry_ms) return tokens;
  return refreshTokens(tokens);
}

// Internal helper: make an authenticated request to the Calendar API.
async function calFetch<T>(
  tokens: GoogleTokens,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const valid = await getValidTokens(tokens);
  const res = await fetch(`${CALENDAR_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${valid.access_token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar API ${res.status}: ${err}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function createCalendarEvent(
  tokens: GoogleTokens,
  calendarId: string,
  event: CalendarEventInput,
): Promise<CalendarEventResult> {
  return calFetch<CalendarEventResult>(
    tokens,
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    { method: "POST", body: JSON.stringify(event) },
  );
}

export async function updateCalendarEvent(
  tokens: GoogleTokens,
  calendarId: string,
  eventId: string,
  event: Partial<CalendarEventInput>,
): Promise<CalendarEventResult> {
  return calFetch<CalendarEventResult>(
    tokens,
    `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    { method: "PATCH", body: JSON.stringify(event) },
  );
}

export async function deleteCalendarEvent(
  tokens: GoogleTokens,
  calendarId: string,
  eventId: string,
): Promise<void> {
  return calFetch<void>(
    tokens,
    `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    { method: "DELETE" },
  );
}

export interface WatchChannelResult {
  channelId: string;
  resourceId: string;
  expiry_ms: number;
}

// Register a push notification channel for calendar changes.
export async function registerWatchChannel(
  tokens: GoogleTokens,
  calendarId: string,
  webhookUrl: string,
  channelId: string,
): Promise<WatchChannelResult> {
  const result = await calFetch<{ id: string; resourceId: string; expiration: string }>(
    tokens,
    `/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    {
      method: "POST",
      body: JSON.stringify({
        id: channelId,
        type: "web_hook",
        address: webhookUrl,
        token: process.env.GOOGLE_WEBHOOK_SECRET,
      }),
    },
  );
  return {
    channelId: result.id,
    resourceId: result.resourceId,
    expiry_ms: Number(result.expiration),
  };
}

// Stop a previously registered push notification channel.
export async function stopWatchChannel(
  tokens: GoogleTokens,
  channelId: string,
  resourceId: string,
): Promise<void> {
  return calFetch<void>(tokens, "/channels/stop", {
    method: "POST",
    body: JSON.stringify({ id: channelId, resourceId }),
  });
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/google/calendar.ts
git commit -m "feat(gcal): add Google Calendar API client with token refresh"
```

---

### Task 3: OAuth connect + callback routes

**Files:**
- Create: `app/api/admin/google/connect/route.ts`
- Create: `app/api/admin/google/callback/route.ts`

- [ ] **Step 1: Create the connect route**

Create directory structure: `app/api/admin/google/connect/`

Create `app/api/admin/google/connect/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

export async function GET() {
  await requireAdmin();

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/google/callback`,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent", // always return refresh_token
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}
```

- [ ] **Step 2: Create the callback route**

Create `app/api/admin/google/callback/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { registerWatchChannel } from "@/lib/google/calendar";
import { randomUUID } from "crypto";
import type { GoogleTokens } from "@/lib/types";

const BASE = () => process.env.NEXT_PUBLIC_BASE_URL!;

export async function GET(request: NextRequest) {
  let identity: { userId: string; email: string };
  try {
    identity = await requireAdmin();
  } catch {
    return NextResponse.redirect(`${BASE()}/portal`);
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${BASE()}/portal/dashboard?gcal=error`);
  }

  // Exchange authorization code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${BASE()}/api/admin/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${BASE()}/portal/dashboard?gcal=error`);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  if (!tokenData.refresh_token) {
    // No refresh token — user did not grant offline access (should not happen with prompt=consent)
    return NextResponse.redirect(`${BASE()}/portal/dashboard?gcal=error&reason=no_refresh`);
  }

  const tokens: GoogleTokens = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry_ms: Date.now() + tokenData.expires_in * 1000 - 60_000,
  };

  // Register a push notification channel with Google
  const channelId = randomUUID();
  const webhookUrl = `${BASE()}/api/admin/google/webhook`;

  let channelData = { channelId: "", resourceId: "", expiry_ms: 0 };
  try {
    channelData = await registerWatchChannel(tokens, "primary", webhookUrl, channelId);
  } catch (err) {
    console.error("Failed to register Google push channel:", err);
    // Non-fatal — still store tokens, just no push notifications
  }

  const supabase = createAdminClient();
  await supabase
    .from("profiles")
    .update({
      google_tokens: tokens,
      google_calendar_id: "primary",
      google_channel_id: channelData.channelId || null,
      google_resource_id: channelData.resourceId || null,
      google_channel_expiry: channelData.expiry_ms || null,
    })
    .eq("id", identity.userId);

  return NextResponse.redirect(`${BASE()}/portal/dashboard?gcal=connected`);
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/google/connect/route.ts app/api/admin/google/callback/route.ts
git commit -m "feat(gcal): add OAuth connect and callback routes"
```

---

### Task 4: Status + disconnect routes

**Files:**
- Create: `app/api/admin/google/status/route.ts`
- Create: `app/api/admin/google/disconnect/route.ts`

- [ ] **Step 1: Create the status route**

Create `app/api/admin/google/status/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidTokens, registerWatchChannel } from "@/lib/google/calendar";
import { randomUUID } from "crypto";
import type { GoogleTokens } from "@/lib/types";

export async function GET() {
  let identity: { userId: string; email: string };
  try {
    identity = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("google_tokens, google_calendar_id, google_channel_id, google_channel_expiry")
    .eq("id", identity.userId)
    .single();

  if (!profile?.google_tokens) {
    return NextResponse.json({ connected: false });
  }

  const tokens = profile.google_tokens as GoogleTokens;

  // Lazily renew push channel if it expires within 24 hours
  const expiryMs = profile.google_channel_expiry as number | null;
  const renewSoon = expiryMs != null && expiryMs < Date.now() + 24 * 60 * 60 * 1000;

  if (renewSoon || !profile.google_channel_id) {
    try {
      const validTokens = await getValidTokens(tokens);
      const calendarId = (profile.google_calendar_id as string | null) ?? "primary";
      const newChannelId = randomUUID();
      const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/google/webhook`;
      const channel = await registerWatchChannel(validTokens, calendarId, webhookUrl, newChannelId);
      await supabase
        .from("profiles")
        .update({
          google_tokens: validTokens,
          google_channel_id: channel.channelId,
          google_resource_id: channel.resourceId,
          google_channel_expiry: channel.expiry_ms,
        })
        .eq("id", identity.userId);
    } catch (err) {
      console.error("Push channel renewal failed:", err);
    }
  }

  return NextResponse.json({ connected: true });
}
```

- [ ] **Step 2: Create the disconnect route**

Create `app/api/admin/google/disconnect/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidTokens, stopWatchChannel } from "@/lib/google/calendar";
import type { GoogleTokens } from "@/lib/types";

export async function DELETE() {
  let identity: { userId: string; email: string };
  try {
    identity = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("google_tokens, google_channel_id, google_resource_id")
    .eq("id", identity.userId)
    .single();

  // Best-effort: stop the push channel before clearing tokens
  if (profile?.google_tokens && profile?.google_channel_id && profile?.google_resource_id) {
    try {
      const tokens = profile.google_tokens as GoogleTokens;
      const validTokens = await getValidTokens(tokens);
      await stopWatchChannel(
        validTokens,
        profile.google_channel_id as string,
        profile.google_resource_id as string,
      );
    } catch (err) {
      console.error("Failed to stop push channel:", err);
    }
  }

  await supabase
    .from("profiles")
    .update({
      google_tokens: null,
      google_calendar_id: null,
      google_channel_id: null,
      google_resource_id: null,
      google_channel_expiry: null,
    })
    .eq("id", identity.userId);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/google/status/route.ts app/api/admin/google/disconnect/route.ts
git commit -m "feat(gcal): add Google Calendar status and disconnect routes"
```

---

### Task 5: Sync job → Google Calendar in the workflow route

**Files:**
- Modify: `app/api/admin/leads/[leadId]/workflow/route.ts`

- [ ] **Step 1: Add calendar sync after job creation**

Open `app/api/admin/leads/[leadId]/workflow/route.ts`.

Add this import at the top of the file (after the existing imports):

```ts
import { getValidTokens, createCalendarEvent } from "@/lib/google/calendar";
import type { GoogleTokens } from "@/lib/types";
```

Find this block near the bottom of the file (around line 182):

```ts
  if (input.action === "schedule" && jobRecord) {
    const icsContent = generateJobIcs(jobRecord);
    void sendScheduledJobEmail({
      lead: updatedLead satisfies LeadRecord,
      job: jobRecord,
      icsContent,
    }).catch((error) => {
      console.error("Scheduled job email failure:", error);
    });
  }
```

Replace it with:

```ts
  if (input.action === "schedule" && jobRecord) {
    const icsContent = generateJobIcs(jobRecord);
    void sendScheduledJobEmail({
      lead: updatedLead satisfies LeadRecord,
      job: jobRecord,
      icsContent,
    }).catch((error) => {
      console.error("Scheduled job email failure:", error);
    });

    // Fire-and-forget: sync the new job to Google Calendar
    void (async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("google_tokens, google_calendar_id")
          .eq("id", adminIdentity.userId)
          .single();

        if (!profile?.google_tokens) return;

        const tokens = profile.google_tokens as GoogleTokens;
        const validTokens = await getValidTokens(tokens);
        const calendarId = (profile.google_calendar_id as string | null) ?? "primary";

        const event = await createCalendarEvent(validTokens, calendarId, {
          summary: jobRecord!.title,
          description: [
            `Customer: ${jobRecord!.customer_name}`,
            jobRecord!.location_address ? `Address: ${jobRecord!.location_address}` : null,
            jobRecord!.notes ? `Notes: ${jobRecord!.notes}` : null,
          ].filter(Boolean).join("\n"),
          location: jobRecord!.location_address ?? undefined,
          start: {
            dateTime: jobRecord!.scheduled_start,
            timeZone: "America/New_York",
          },
          end: {
            dateTime: jobRecord!.scheduled_end ?? jobRecord!.scheduled_start,
            timeZone: "America/New_York",
          },
        });

        // Store the Google Calendar event ID on the job + update tokens if refreshed
        await supabase
          .from("jobs")
          .update({
            gcal_event_id: event.id,
            gcal_synced_at: new Date().toISOString(),
          })
          .eq("id", jobRecord!.id);

        if (validTokens.access_token !== tokens.access_token) {
          await supabase
            .from("profiles")
            .update({ google_tokens: validTokens })
            .eq("id", adminIdentity.userId);
        }
      } catch (err) {
        console.error("Google Calendar sync failed:", err);
      }
    })();
  }
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/leads/"[leadId]"/workflow/route.ts
git commit -m "feat(gcal): sync new job to Google Calendar on schedule action"
```

---

### Task 6: Sync job completion → delete calendar event

**Files:**
- Modify: `app/api/admin/leads/[leadId]/route.ts`

- [ ] **Step 1: Read the existing PATCH handler**

Open `app/api/admin/leads/[leadId]/route.ts` and read it fully.

- [ ] **Step 2: Add imports at the top of the file**

Add these two imports alongside the existing ones at the top:

```ts
import { getValidTokens, deleteCalendarEvent } from "@/lib/google/calendar";
import type { GoogleTokens } from "@/lib/types";
```

- [ ] **Step 3: Add calendar event deletion after mark-done**

Find the line where the route returns a success response after the `completed_at` patch (look for `return NextResponse.json({ ... })` after the successful update). Insert this block **before** that return statement:

```ts
// Fire-and-forget: delete the Google Calendar event when job is marked done
void (async () => {
  try {
    const supabaseAdmin = createAdminClient();

    // Get the job linked to this lead
    const { data: job } = await supabaseAdmin
      .from("jobs")
      .select("id, gcal_event_id")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!job?.gcal_event_id) return;

    // Get admin profile for tokens
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("google_tokens, google_calendar_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (!profile?.google_tokens) return;

    const tokens = profile.google_tokens as GoogleTokens;
    const validTokens = await getValidTokens(tokens);
    const calendarId = (profile.google_calendar_id as string | null) ?? "primary";

    await deleteCalendarEvent(validTokens, calendarId, job.gcal_event_id as string);

    await supabaseAdmin
      .from("jobs")
      .update({ gcal_event_id: null, gcal_synced_at: new Date().toISOString() })
      .eq("id", job.id);
  } catch (err) {
    console.error("Google Calendar delete on mark-done failed:", err);
  }
})();
```

> **Note:** The dynamic import (`await import(...)`) keeps this block self-contained. If you prefer, you can add `import { getValidTokens, deleteCalendarEvent } from "@/lib/google/calendar"` at the top of the file instead and use them directly.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/leads/"[leadId]"/route.ts
git commit -m "feat(gcal): delete Google Calendar event when job is marked done"
```

---

### Task 7: Webhook receiver

**Files:**
- Create: `app/api/admin/google/webhook/route.ts`

- [ ] **Step 1: Create the webhook route**

Create `app/api/admin/google/webhook/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidTokens } from "@/lib/google/calendar";
import type { GoogleTokens } from "@/lib/types";

export async function POST(request: NextRequest) {
  const channelToken = request.headers.get("X-Goog-Channel-Token");
  const channelId = request.headers.get("X-Goog-Channel-ID");
  const resourceState = request.headers.get("X-Goog-Resource-State");

  // Reject requests with wrong token
  if (channelToken !== process.env.GOOGLE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // "sync" is Google's initial handshake — acknowledge and do nothing
  if (resourceState === "sync") {
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();

  // Find the admin profile that owns this channel
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, google_tokens, google_calendar_id")
    .eq("google_channel_id", channelId)
    .single();

  if (!profile?.google_tokens) {
    return NextResponse.json({ error: "No matching profile" }, { status: 404 });
  }

  const tokens = profile.google_tokens as GoogleTokens;
  const calendarId = (profile.google_calendar_id as string | null) ?? "primary";

  let validTokens: GoogleTokens;
  try {
    validTokens = await getValidTokens(tokens);
  } catch (err) {
    console.error("Google token refresh failed in webhook:", err);
    return NextResponse.json({ error: "Token refresh failed" }, { status: 500 });
  }

  // Fetch events changed in the last 10 minutes
  // (webhook is a ping — we must query to find what changed)
  const updatedMin = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const eventsRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
      new URLSearchParams({ updatedMin, showDeleted: "true" }).toString(),
    {
      headers: { Authorization: `Bearer ${validTokens.access_token}` },
    },
  );

  if (!eventsRes.ok) {
    return NextResponse.json({ error: "Events fetch failed" }, { status: 500 });
  }

  type GoogleEvent = {
    id: string;
    status: string;
    start?: { dateTime?: string };
    end?: { dateTime?: string };
  };

  const { items = [] } = (await eventsRes.json()) as { items: GoogleEvent[] };

  for (const event of items) {
    if (event.status === "cancelled") {
      // Deleted in Google Calendar — cancel the job
      await supabase
        .from("jobs")
        .update({
          status: "cancelled",
          gcal_synced_at: new Date().toISOString(),
        })
        .eq("gcal_event_id", event.id)
        .eq("status", "scheduled"); // only cancel jobs that are still scheduled
    } else if (event.start?.dateTime && event.end?.dateTime) {
      // Rescheduled in Google Calendar — update job times
      await supabase
        .from("jobs")
        .update({
          scheduled_start: event.start.dateTime,
          scheduled_end: event.end.dateTime,
          gcal_synced_at: new Date().toISOString(),
        })
        .eq("gcal_event_id", event.id);
    }
  }

  // Persist refreshed tokens if they changed
  if (validTokens.access_token !== tokens.access_token) {
    await supabase
      .from("profiles")
      .update({ google_tokens: validTokens })
      .eq("id", profile.id as string);
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/google/webhook/route.ts
git commit -m "feat(gcal): add Google Calendar webhook receiver for two-way sync"
```

---

### Task 8: Update CalendarSection with connect banner + event chips

**Files:**
- Modify: `components/admin/sections/CalendarSection.tsx`

- [ ] **Step 1: Add connection state and the banner**

Open `components/admin/sections/CalendarSection.tsx`. Make these changes:

1. Add a `connected` state and fetch it on mount. Add to the existing imports and inside the component, after the `jobs` state:

```tsx
const [connected, setConnected] = useState<boolean | null>(null);

useEffect(() => {
  async function checkConnection() {
    const res = await fetch("/api/admin/google/status");
    if (res.ok) {
      const data = (await res.json()) as { connected: boolean };
      setConnected(data.connected);
    }
  }
  void checkConnection();
}, []);

async function handleDisconnect() {
  if (!window.confirm("Disconnect Google Calendar? Jobs will no longer sync.")) return;
  await fetch("/api/admin/google/disconnect", { method: "DELETE" });
  setConnected(false);
}
```

2. Add the connect/connected banner between the page heading and the nav buttons. Find the `<div className="flex items-center gap-3">` (Prev/Next nav) and insert before it:

```tsx
{/* Google Calendar connection banner */}
{connected === false && (
  <div className="flex items-center justify-between rounded-lg border border-brand-red/30 bg-white p-3.5 mb-1">
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-navy/10 bg-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="#1D3557" strokeWidth="1.5"/>
          <line x1="3" y1="10" x2="21" y2="10" stroke="#C8102E" strokeWidth="1.5"/>
          <line x1="8" y1="2" x2="8" y2="6" stroke="#1D3557" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="16" y1="2" x2="16" y2="6" stroke="#1D3557" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div>
        <p className="text-xs font-semibold text-navy">Connect Google Calendar</p>
        <p className="text-[10px] text-navy/45 mt-0.5">
          Sync jobs to contact@sudsonwheelsusa.com automatically
        </p>
      </div>
    </div>
    <a
      href="/api/admin/google/connect"
      className="shrink-0 rounded-md bg-navy px-3 py-1.5 text-[11px] font-bold text-white hover:bg-navy/90 transition-colors"
    >
      Connect
    </a>
  </div>
)}

{connected === true && (
  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 mb-1">
    <div className="flex items-center gap-2.5">
      <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
      <div>
        <p className="text-[11px] font-semibold text-emerald-800">
          Connected — contact@sudsonwheelsusa.com
        </p>
        <p className="text-[9px] text-emerald-700/70 mt-0.5">
          Jobs sync automatically · changes on your phone update here
        </p>
      </div>
    </div>
    <button
      type="button"
      onClick={handleDisconnect}
      className="text-[10px] text-emerald-700/50 underline hover:text-emerald-700 transition-colors"
    >
      Disconnect
    </button>
  </div>
)}
```

3. Update the job event chip to show blue when it was last modified via Google Calendar sync. Find the job chip `<div>` block and replace it:

```tsx
{dayJobs.map((job) => {
  // Blue chip if last change came from Google Calendar (synced within the last 6 hours)
  const fromGoogle = job.gcal_synced_at != null &&
    new Date(job.gcal_synced_at).getTime() > Date.now() - 6 * 60 * 60 * 1000;

  return (
    <div
      key={job.id}
      className={`rounded-sm px-1.5 py-1 mt-1 ${fromGoogle ? "bg-[#4285f4]" : "bg-navy"}`}
    >
      <p className="text-[9px] font-semibold text-white truncate">{job.customer_name}</p>
      <p className="text-[8px] text-white/55 mt-0.5">
        {new Date(job.scheduled_start).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>
      <p className="text-[8px] text-white/55 truncate">{job.service_name}</p>
    </div>
  );
})}
```

4. Update the `select` in the `useEffect` to include `gcal_event_id` and `gcal_synced_at`:

```tsx
.select("id, lead_id, estimate_id, title, status, scheduled_start, scheduled_end, service_name, customer_name, location_address, location_lat, location_lng, notes, created_by, created_at, gcal_event_id, gcal_synced_at")
```

5. Handle the `?gcal=connected` query param to show a success flash. Add to the top of the component:

```tsx
import { useSearchParams } from "next/navigation";

// Inside the component:
const searchParams = useSearchParams();
const gcalParam = searchParams.get("gcal");
```

Then add below the connected banner:

```tsx
{gcalParam === "connected" && connected === true && (
  <p className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-800">
    Google Calendar connected. Jobs will now sync automatically.
  </p>
)}
{gcalParam === "error" && (
  <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-brand-red">
    Could not connect Google Calendar. Check your Google account and try again.
  </p>
)}
```

6. Add a legend below the calendar grid:

```tsx
<div className="mt-3 flex gap-4 items-center">
  <div className="flex items-center gap-1.5">
    <div className="h-2.5 w-2.5 rounded-sm bg-navy" />
    <span className="text-[9px] text-navy/45">Scheduled from app</span>
  </div>
  {connected && (
    <div className="flex items-center gap-1.5">
      <div className="h-2.5 w-2.5 rounded-sm bg-[#4285f4]" />
      <span className="text-[9px] text-navy/45">Updated via Google Calendar</span>
    </div>
  )}
</div>
```

- [ ] **Step 2: Add `"use client"` guard for useSearchParams**

`useSearchParams` requires the component to be wrapped in `<Suspense>` in Next.js 15. The component already has `"use client"` at the top. In the parent (`AdminDashboard.tsx`), wrap the Calendar section render:

```tsx
// In AdminDashboard.tsx, change:
{section === "calendar" && <CalendarSection />}

// To:
{section === "calendar" && (
  <Suspense>
    <CalendarSection />
  </Suspense>
)}
```

Add `import { Suspense } from "react"` at the top of `AdminDashboard.tsx`.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/admin/sections/CalendarSection.tsx components/admin/AdminDashboard.tsx
git commit -m "feat(gcal): add connect banner, event chips, and legend to CalendarSection"
```

---

### Task 9: End-to-end manual test

> For local webhook testing you need a public URL. Use [ngrok](https://ngrok.com): `ngrok http 3000`. Set `NEXT_PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io` in `.env.local` and restart the dev server.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test connect flow**

1. Sign in to the admin portal
2. Go to Calendar section
3. Verify the red "Connect Google Calendar" banner is visible
4. Click "Connect" — verify you're redirected to Google's OAuth consent screen
5. Sign in as `contact@sudsonwheelsusa.com` and grant Calendar access
6. Verify you're redirected back to `/portal/dashboard?gcal=connected`
7. Go to Calendar section — verify green "Connected" banner with the email address
8. Verify the success message "Google Calendar connected. Jobs will now sync automatically."

- [ ] **Step 3: Test job → calendar sync**

1. Go to Leads Pipeline
2. Find a lead with status "quoted" (or create a test lead first via the contact form)
3. Click "Schedule" on a quoted lead
4. Set a start time, enter a job title, click "Schedule job"
5. Open Google Calendar on your phone or at calendar.google.com (signed in as `contact@sudsonwheelsusa.com`)
6. Verify the new job appears as a calendar event with the correct title, time, and address

- [ ] **Step 4: Test Google Calendar → app sync (requires ngrok)**

1. Open Google Calendar and find the job event you just created
2. Drag it to a different day/time (reschedule it)
3. Wait up to 60 seconds for Google to send the push notification
4. Refresh the Calendar section in the admin portal
5. Verify the job's date/time has updated to match the new time in Google Calendar
6. The event chip should now appear in blue (updated via Google)

- [ ] **Step 5: Test disconnect**

1. In the Calendar section, click "Disconnect"
2. Confirm the dialog
3. Verify the banner changes back to "Connect Google Calendar"
4. Schedule another test job and verify it does NOT appear in Google Calendar

- [ ] **Step 6: Final type-check and commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat(gcal): complete Google Calendar two-way sync implementation"
```
