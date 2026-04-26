# Admin Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the admin dashboard as a sidebar-navigated app with a Kanban lead pipeline, .ics calendar integration, quote revision, and an email reply-to fix.

**Architecture:** Replace the monolithic `AdminDashboard.tsx` (1082 lines) with a shell component + six focused section components. Each section fetches its own data. Two new API routes handle `.ics` download and mark-done. A shared `lib/ics.ts` utility generates `.ics` content used by both the API route and the scheduled-job email.

**Tech Stack:** Next.js 15 App Router, React, Supabase browser client, Resend, Tailwind CSS v4, shadcn/ui Button, Zod

---

## File Map

**Create:**
- `supabase/migrations/<timestamp>_leads_completed_at.sql`
- `lib/ics.ts` — ICS file generator
- `lib/schemas/admin-mark-done.ts` — Zod schema for PATCH body
- `app/api/admin/jobs/[jobId]/ics/route.ts` — download .ics for a job
- `app/api/admin/leads/[leadId]/route.ts` — PATCH to mark done
- `components/admin/sections/OverviewSection.tsx`
- `components/admin/sections/ServicesSection.tsx`
- `components/admin/sections/GallerySection.tsx`
- `components/admin/sections/CalendarSection.tsx`
- `components/admin/sections/LeadCard.tsx`
- `components/admin/sections/LeadsPipeline.tsx`

**Modify:**
- `lib/types.ts` — add `completed_at` to `LeadRecord`
- `lib/email/send.ts` — add `replyTo` + `attachments` support; attach `.ics` to scheduled-job email
- `components/admin/AdminDashboard.tsx` — replace internals with `AdminShell` implementation

---

## Task 1: Schema migration — add `completed_at` to leads

**Files:**
- Create: `supabase/migrations/20260419200000_leads_completed_at.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260419200000_leads_completed_at.sql
alter table public.leads
  add column if not exists completed_at timestamptz;

create index if not exists leads_completed_at_idx
  on public.leads (completed_at)
  where completed_at is not null;
```

- [ ] **Step 2: Apply via Supabase MCP**

Use the `apply_migration` MCP tool:
```
project_id: qjwzvvrzqricfkkprtwk
name: leads_completed_at
query: <paste SQL above>
```

- [ ] **Step 3: Verify column exists**

Use `execute_sql`:
```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'leads'
  and column_name = 'completed_at';
```
Expected: one row, `data_type = timestamp with time zone`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260419200000_leads_completed_at.sql
git commit -m "feat: add completed_at column to leads"
```

---

## Task 2: Update `LeadRecord` type

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add `completed_at` to `LeadRecord`**

In `lib/types.ts`, add the field after `scheduled_job_id`:

```ts
export interface LeadRecord {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  service_id: string | null;
  service_name: string;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  message: string | null;
  status: "new" | "approved" | "rejected" | "quoted" | "scheduled";
  internal_notes: string | null;
  quoted_amount: number | null;
  estimate_sent_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  scheduled_job_id: string | null;
  completed_at: string | null;
  created_at: string;
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add completed_at to LeadRecord type"
```

---

## Task 3: Email reply-to fix

**Files:**
- Modify: `lib/email/send.ts`

- [ ] **Step 1: Update `sendEmail` to accept `replyTo` and `attachments`**

Replace the entire `lib/email/send.ts`:

```ts
import "server-only";

import { Resend } from "resend";
import type { JobRecord, LeadRecord } from "@/lib/types";

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "SudsOnWheels <noreply@sudsonwheelsusa.com>";

const REPLY_TO = process.env.OWNER_EMAIL ?? "contact@sudsonwheelsusa.com";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

async function sendEmail(input: {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: string }>;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: input.to,
    subject: input.subject,
    text: input.text,
    replyTo: input.replyTo,
    attachments: input.attachments,
  });
}

export async function sendLeadNotificationEmails(lead: LeadRecord) {
  const ownerEmail = process.env.OWNER_EMAIL;

  const ownerLines = [
    "A new quote request was sent.",
    "",
    `Lead ID: ${lead.id}`,
    `Name: ${lead.first_name} ${lead.last_name}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email}`,
    `Service: ${lead.service_name}`,
    lead.location_address ? `Address: ${lead.location_address}` : "",
    lead.message ? `Message: ${lead.message}` : "",
    "",
    `Admin review: /portal/dashboard`,
  ]
    .filter(Boolean)
    .join("\n");

  const customerLines = [
    `Hi ${lead.first_name},`,
    "",
    "We received your quote request and will review it shortly.",
    `Requested service: ${lead.service_name}`,
    lead.location_address ? `Address: ${lead.location_address}` : "",
    "",
    "You should hear back from us within one business day.",
    "",
    "SudsOnWheels",
  ]
    .filter(Boolean)
    .join("\n");

  await Promise.allSettled([
    ownerEmail
      ? sendEmail({ to: ownerEmail, subject: `New quote request - ${lead.first_name} ${lead.last_name}`, text: ownerLines })
      : Promise.resolve(),
    sendEmail({
      to: lead.email,
      subject: "We received your request",
      text: customerLines,
      replyTo: REPLY_TO,
    }),
  ]);
}

export async function sendQuoteEmail(input: {
  lead: LeadRecord;
  amount: number;
  notes?: string | null;
}) {
  await sendEmail({
    to: input.lead.email,
    subject: "Your SudsOnWheels estimate",
    replyTo: REPLY_TO,
    text: [
      `Hi ${input.lead.first_name},`,
      "",
      `Your estimate for ${input.lead.service_name} is $${input.amount.toFixed(2)}.`,
      input.notes ? `Notes: ${input.notes}` : "",
      "",
      "Reply to this email or give us a call if you want to move forward.",
      "",
      "SudsOnWheels",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function sendScheduledJobEmail(input: {
  lead: LeadRecord;
  job: JobRecord;
  icsContent?: string;
}) {
  await sendEmail({
    to: input.lead.email,
    subject: "Your SudsOnWheels job is scheduled",
    replyTo: REPLY_TO,
    text: [
      `Hi ${input.lead.first_name},`,
      "",
      `Your ${input.lead.service_name} job is scheduled for ${new Date(
        input.job.scheduled_start
      ).toLocaleString()}.`,
      input.job.location_address ? `Location: ${input.job.location_address}` : "",
      "",
      "A calendar invite is attached — tap it to add the appointment to your calendar.",
      "",
      "If anything changes, just reply to this email.",
      "",
      "SudsOnWheels",
    ]
      .filter(Boolean)
      .join("\n"),
    attachments: input.icsContent
      ? [{ filename: "appointment.ics", content: Buffer.from(input.icsContent).toString("base64") }]
      : undefined,
  });
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add lib/email/send.ts
git commit -m "feat: add reply-to header and ics attachment support to emails"
```

---

## Task 4: ICS utility

**Files:**
- Create: `lib/ics.ts`

- [ ] **Step 1: Create `lib/ics.ts`**

```ts
import type { JobRecord } from "@/lib/types";

function icsDate(iso: string): string {
  return iso.replace(/[-:]/g, "").split(".")[0] + "Z";
}

function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function generateJobIcs(job: Pick<JobRecord, "id" | "title" | "scheduled_start" | "scheduled_end" | "location_address" | "service_name" | "customer_name">): string {
  const now = icsDate(new Date().toISOString());
  const start = icsDate(job.scheduled_start);
  const end = job.scheduled_end
    ? icsDate(job.scheduled_end)
    : icsDate(new Date(new Date(job.scheduled_start).getTime() + 60 * 60 * 1000).toISOString());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SudsOnWheels//Job Scheduler//EN",
    "BEGIN:VEVENT",
    `UID:${job.id}@sudsonwheelsusa.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${icsEscape(job.title)}`,
    job.location_address ? `LOCATION:${icsEscape(job.location_address)}` : "",
    `DESCRIPTION:${icsEscape(`${job.service_name} - ${job.customer_name}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add lib/ics.ts
git commit -m "feat: add ICS calendar file generator"
```

---

## Task 5: ICS API route

**Files:**
- Create: `app/api/admin/jobs/[jobId]/ics/route.ts`

- [ ] **Step 1: Create route**

```ts
import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateJobIcs } from "@/lib/ics";

async function getAdminUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error) return null;
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (!userId) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return !profileError && profile?.role === "admin" ? userId : null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const adminId = await getAdminUserId();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { jobId } = await context.params;
  const supabase = createAdminClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, title, scheduled_start, scheduled_end, location_address, service_name, customer_name")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const ics = generateJobIcs(job);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="job-${jobId}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/jobs/
git commit -m "feat: add ICS download route for scheduled jobs"
```

---

## Task 6: Mark Done API route

**Files:**
- Create: `lib/schemas/admin-mark-done.ts`
- Create: `app/api/admin/leads/[leadId]/route.ts`

- [ ] **Step 1: Create Zod schema**

```ts
// lib/schemas/admin-mark-done.ts
import { z } from "zod";

export const adminMarkDoneSchema = z.object({
  completed_at: z.string().datetime().nullable(),
});

export type AdminMarkDoneInput = z.infer<typeof adminMarkDoneSchema>;
```

- [ ] **Step 2: Create PATCH route**

```ts
// app/api/admin/leads/[leadId]/route.ts
import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminMarkDoneSchema } from "@/lib/schemas/admin-mark-done";

async function getAdminUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error) return null;
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (!userId) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return !profileError && profile?.role === "admin" ? userId : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  const adminId = await getAdminUserId();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { leadId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = adminMarkDoneSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: updated, error: updateError } = await supabase
    .from("leads")
    .update({ completed_at: result.data.completed_at })
    .eq("id", leadId)
    .select("id, completed_at")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Could not update lead." }, { status: 500 });
  }

  return NextResponse.json({ success: true, lead: updated });
}
```

- [ ] **Step 3: Type-check**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add lib/schemas/admin-mark-done.ts app/api/admin/leads/[leadId]/route.ts
git commit -m "feat: add PATCH /api/admin/leads/[leadId] for mark-done"
```

---

## Task 7: Wire ICS into scheduled-job email

**Files:**
- Modify: `app/api/admin/leads/[leadId]/workflow/route.ts`

- [ ] **Step 1: Import `generateJobIcs` and pass ICS content to `sendScheduledJobEmail`**

In `app/api/admin/leads/[leadId]/workflow/route.ts`, add the import at the top:

```ts
import { generateJobIcs } from "@/lib/ics";
```

Then find the block that calls `sendScheduledJobEmail` (around line 181) and update it:

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

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/leads/[leadId]/workflow/route.ts
git commit -m "feat: attach ICS calendar invite to scheduled-job confirmation email"
```

---

## Task 8: OverviewSection

**Files:**
- Create: `components/admin/sections/OverviewSection.tsx`

- [ ] **Step 1: Create component**

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { LeadRecord } from "@/lib/types";

export default function OverviewSection() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("leads")
        .select("id, first_name, last_name, service_name, status, completed_at, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      setLeads((data ?? []) as LeadRecord[]);
      setLoading(false);
    }
    void load();
  }, []);

  const activeleads = leads.filter((l) => l.completed_at == null);
  const newCount = activeleads.filter((l) => l.status === "new").length;
  const quotedCount = activeleads.filter((l) => l.status === "quoted").length;
  const scheduledCount = activeleads.filter((l) => l.status === "scheduled").length;
  const recent = leads.slice(0, 5);

  const statusStyle: Record<string, string> = {
    new: "bg-slate-100 text-slate-700",
    quoted: "bg-amber-100 text-amber-800",
    approved: "bg-blue-100 text-blue-800",
    scheduled: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-700",
    done: "bg-slate-100 text-slate-400",
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-navy">Overview</h2>
        <p className="text-sm text-slate-500 mt-1">Welcome back. Here's what's active.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "New Leads", value: newCount },
          { label: "Quotes Sent", value: quotedCount },
          { label: "Scheduled Jobs", value: scheduledCount },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-black text-navy">
              {loading ? "—" : stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-navy mb-4">Recent Activity</h3>
        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : recent.length === 0 ? (
          <p className="text-sm text-slate-400">No leads yet.</p>
        ) : (
          <div className="space-y-3">
            {recent.map((lead) => {
              const displayStatus = lead.completed_at ? "done" : lead.status;
              return (
                <div
                  key={lead.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-navy">
                      {lead.first_name} {lead.last_name}
                    </p>
                    <p className="text-xs text-slate-500">{lead.service_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyle[displayStatus] ?? statusStyle.new}`}
                    >
                      {displayStatus}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/admin/sections/OverviewSection.tsx
git commit -m "feat: add OverviewSection with stats and activity feed"
```

---

## Task 9: ServicesSection

**Files:**
- Create: `components/admin/sections/ServicesSection.tsx`

- [ ] **Step 1: Create component** (extracted from AdminDashboard, no functional changes)

```tsx
"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import { SERVICE_ICON_OPTIONS, ServiceIcon } from "@/lib/service-icons";
import type { ServiceRecord } from "@/lib/types";

export default function ServicesSection() {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    icon: "House",
    sort_order: "7",
  });

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("services")
      .select("id, name, description, icon, sort_order, is_active, created_at")
      .order("sort_order", { ascending: true });
    if (err) setError(err.message);
    else setServices((data ?? []) as ServiceRecord[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyKey("add");
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.from("services").insert({
      name: form.name,
      description: form.description,
      icon: form.icon,
      sort_order: Number(form.sort_order) || 0,
    });
    setBusyKey(null);
    if (err) { setError(err.message); return; }
    setForm({ name: "", description: "", icon: "House", sort_order: String(services.length + 1) });
    await load();
  }

  async function toggle(service: ServiceRecord) {
    setBusyKey(`toggle:${service.id}`);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("services")
      .update({ is_active: !service.is_active })
      .eq("id", service.id);
    setBusyKey(null);
    if (err) { setError(err.message); return; }
    await load();
  }

  async function remove(serviceId: string) {
    setBusyKey(`delete:${serviceId}`);
    const supabase = createClient();
    const { error: err } = await supabase.from("services").delete().eq("id", serviceId);
    setBusyKey(null);
    if (err) { setError(err.message); return; }
    await load();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-black text-navy">Services</h2>
        <p className="text-sm text-slate-500 mt-1">Add, pause, or remove public service offerings.</p>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-brand-red">
          {error}
        </p>
      )}

      <form onSubmit={handleAdd} className="grid gap-3 rounded-2xl bg-slate-50 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
            placeholder="Service name"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            required
          />
          <select
            value={form.icon}
            onChange={(e) => setForm((c) => ({ ...c, icon: e.target.value }))}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            {SERVICE_ICON_OPTIONS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <textarea
          value={form.description}
          onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
          placeholder="Service description"
          rows={3}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          required
        />
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            value={form.sort_order}
            onChange={(e) => setForm((c) => ({ ...c, sort_order: e.target.value }))}
            className="w-28 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          <Button type="submit" className="bg-navy text-white hover:bg-navy/90" disabled={busyKey === "add"}>
            {busyKey === "add" ? "Saving..." : "Add service"}
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {loading && <p className="text-sm text-slate-400">Loading...</p>}
        {services.map((service) => (
          <div
            key={service.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 shrink-0">
                <ServiceIcon name={service.icon} className="size-5 text-navy" />
              </div>
              <div>
                <p className="font-semibold text-navy">{service.name}</p>
                <p className="text-sm text-slate-500">{service.description}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => toggle(service)}
                disabled={busyKey === `toggle:${service.id}`}
              >
                {service.is_active ? "Hide" : "Show"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => remove(service.id)}
                disabled={busyKey === `delete:${service.id}`}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/admin/sections/ServicesSection.tsx
git commit -m "feat: extract ServicesSection component"
```

---

## Task 10: GallerySection

**Files:**
- Create: `components/admin/sections/GallerySection.tsx`

- [ ] **Step 1: Create component** (extracted from AdminDashboard)

```tsx
"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import type { GalleryRecord } from "@/lib/types";

export default function GallerySection() {
  const [items, setItems] = useState<GalleryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    location: "",
    detail: "",
    before_label: "Before wash",
    after_label: "After wash",
    sort_order: "1",
    before_file: null as File | null,
    after_file: null as File | null,
  });

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("gallery_items")
      .select("id, title, location, detail, before_image_path, after_image_path, before_label, after_label, sort_order, is_active, created_at")
      .order("sort_order", { ascending: true });
    if (err) { setError(err.message); setLoading(false); return; }

    const withUrls = (data ?? []).map((item) => ({
      ...item,
      before_image_url: item.before_image_path
        ? supabase.storage.from("gallery").getPublicUrl(item.before_image_path).data.publicUrl
        : null,
      after_image_url: item.after_image_path
        ? supabase.storage.from("gallery").getPublicUrl(item.after_image_path).data.publicUrl
        : null,
    })) satisfies GalleryRecord[];

    setItems(withUrls);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function uploadFile(file: File, folder: "before" | "after") {
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error: err } = await supabase.storage.from("gallery").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (err) throw err;
    return path;
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.before_file || !form.after_file) {
      setError("Both before and after photos are required.");
      return;
    }
    setBusyKey("add");
    setError("");
    const supabase = createClient();
    try {
      const [beforePath, afterPath] = await Promise.all([
        uploadFile(form.before_file, "before"),
        uploadFile(form.after_file, "after"),
      ]);
      const { error: err } = await supabase.from("gallery_items").insert({
        title: form.title,
        location: form.location,
        detail: form.detail,
        before_image_path: beforePath,
        after_image_path: afterPath,
        before_label: form.before_label,
        after_label: form.after_label,
        sort_order: Number(form.sort_order) || 0,
      });
      if (err) throw err;
      setForm({ title: "", location: "", detail: "", before_label: "Before wash", after_label: "After wash", sort_order: String(items.length + 1), before_file: null, after_file: null });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload photos.");
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleItem(item: GalleryRecord) {
    setBusyKey(`toggle:${item.id}`);
    const supabase = createClient();
    const { error: err } = await supabase.from("gallery_items").update({ is_active: !item.is_active }).eq("id", item.id);
    setBusyKey(null);
    if (err) { setError(err.message); return; }
    await load();
  }

  async function removeItem(item: GalleryRecord) {
    setBusyKey(`delete:${item.id}`);
    const supabase = createClient();
    const paths = [item.before_image_path, item.after_image_path].filter(Boolean) as string[];
    if (paths.length) {
      const { error: storErr } = await supabase.storage.from("gallery").remove(paths);
      if (storErr) { setBusyKey(null); setError(storErr.message); return; }
    }
    const { error: err } = await supabase.from("gallery_items").delete().eq("id", item.id);
    setBusyKey(null);
    if (err) { setError(err.message); return; }
    await load();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-black text-navy">Gallery</h2>
        <p className="text-sm text-slate-500 mt-1">Upload before-and-after jobs directly into the public gallery.</p>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-brand-red">
          {error}
        </p>
      )}

      <form onSubmit={handleAdd} className="grid gap-3 rounded-2xl bg-slate-50 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} placeholder="Title" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" required />
          <input value={form.location} onChange={(e) => setForm((c) => ({ ...c, location: e.target.value }))} placeholder="Location" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" required />
        </div>
        <input value={form.detail} onChange={(e) => setForm((c) => ({ ...c, detail: e.target.value }))} placeholder="Detail" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" required />
        <div className="grid gap-3 sm:grid-cols-2">
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setForm((c) => ({ ...c, before_file: e.target.files?.[0] ?? null }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required />
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setForm((c) => ({ ...c, after_file: e.target.files?.[0] ?? null }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
          <input value={form.before_label} onChange={(e) => setForm((c) => ({ ...c, before_label: e.target.value }))} placeholder="Before label" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <input value={form.after_label} onChange={(e) => setForm((c) => ({ ...c, after_label: e.target.value }))} placeholder="After label" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <input type="number" min={0} value={form.sort_order} onChange={(e) => setForm((c) => ({ ...c, sort_order: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        </div>
        <Button type="submit" className="w-fit bg-navy text-white hover:bg-navy/90" disabled={busyKey === "add"}>
          {busyKey === "add" ? "Uploading..." : "Add gallery item"}
        </Button>
      </form>

      <div className="space-y-3">
        {loading && <p className="text-sm text-slate-400">Loading...</p>}
        {items.map((item) => (
          <div key={item.id} className="grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[180px_1fr_auto]">
            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200">
              {item.before_image_url ? (
                <img src={item.before_image_url} alt={`${item.title} before`} className="h-24 w-full object-cover" />
              ) : (
                <div className="flex h-24 items-center justify-center bg-slate-100 text-xs text-slate-500">No before</div>
              )}
              {item.after_image_url ? (
                <img src={item.after_image_url} alt={`${item.title} after`} className="h-24 w-full object-cover" />
              ) : (
                <div className="flex h-24 items-center justify-center bg-slate-100 text-xs text-slate-500">No after</div>
              )}
            </div>
            <div>
              <p className="font-semibold text-navy">{item.title}</p>
              <p className="text-sm text-slate-500">{item.location} · {item.detail}</p>
            </div>
            <div className="flex gap-2 items-start">
              <Button type="button" variant="outline" size="sm" onClick={() => toggleItem(item)} disabled={busyKey === `toggle:${item.id}`}>
                {item.is_active ? "Hide" : "Show"}
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(item)} disabled={busyKey === `delete:${item.id}`}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/admin/sections/GallerySection.tsx
git commit -m "feat: extract GallerySection component"
```

---

## Task 11: CalendarSection

**Files:**
- Create: `components/admin/sections/CalendarSection.tsx`

- [ ] **Step 1: Create component** (extracted from AdminDashboard + .ics download button on each job)

```tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import type { JobRecord } from "@/lib/types";

function getMonthGrid(month: Date): Date[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());
  const gridEnd = new Date(lastDay);
  gridEnd.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

  const days: Date[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export default function CalendarSection() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("jobs")
        .select("id, lead_id, estimate_id, title, status, scheduled_start, scheduled_end, service_name, customer_name, location_address, location_lat, location_lng, notes, created_by, created_at")
        .order("scheduled_start", { ascending: true });
      setJobs((data ?? []) as JobRecord[]);
      setLoading(false);
    }
    void load();
  }, []);

  const gridDays = getMonthGrid(currentMonth);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-navy">Job Calendar</h2>
        <p className="text-sm text-slate-500 mt-1">Approved jobs appear here once scheduled.</p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
        >
          Prev
        </Button>
        <span className="min-w-40 text-center text-sm font-semibold text-navy">
          {currentMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
        >
          Next
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {gridDays.map((day) => {
              const dayJobs = jobs.filter((job) => {
                const d = new Date(job.scheduled_start);
                return (
                  d.getFullYear() === day.getFullYear() &&
                  d.getMonth() === day.getMonth() &&
                  d.getDate() === day.getDate()
                );
              });
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-28 rounded-2xl border p-2 text-left ${
                    isCurrentMonth
                      ? "border-slate-200 bg-white"
                      : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-400">{day.getDate()}</p>
                  <div className="mt-1 space-y-1.5">
                    {dayJobs.map((job) => (
                      <div
                        key={job.id}
                        className="rounded-xl bg-navy/10 px-2 py-1.5 text-[11px] text-navy"
                      >
                        <p className="font-semibold truncate">{job.customer_name}</p>
                        <p className="text-slate-500">
                          {new Date(job.scheduled_start).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="truncate text-slate-500">{job.service_name}</p>
                        <a
                          href={`/api/admin/jobs/${job.id}/ics`}
                          download
                          className="mt-1 inline-block text-[10px] font-semibold text-navy underline underline-offset-2 hover:text-navy/70"
                        >
                          + Calendar
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/admin/sections/CalendarSection.tsx
git commit -m "feat: extract CalendarSection with ICS download per job"
```

---

## Task 12: LeadCard

**Files:**
- Create: `components/admin/sections/LeadCard.tsx`

- [ ] **Step 1: Create component**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { LeadRecord } from "@/lib/types";

type Props = {
  lead: LeadRecord;
  onUpdate: () => void;
};

type InlineForm = "quote" | "schedule" | null;

function formatCurrency(amount: number | null): string {
  if (amount == null) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export default function LeadCard({ lead, onUpdate }: Props) {
  const [inlineForm, setInlineForm] = useState<InlineForm>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(lead.quoted_amount?.toString() ?? "");
  const [notes, setNotes] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [title, setTitle] = useState(
    `${lead.service_name} - ${lead.first_name} ${lead.last_name}`
  );

  const isDone = lead.completed_at != null;

  async function runWorkflow(
    action: "approve" | "reject" | "quote" | "schedule"
  ) {
    setBusy(true);
    setError("");

    const payload: Record<string, unknown> = { action };
    if (notes) payload.estimate_notes = notes;
    if (amount) payload.quoted_amount = Number(amount);
    if (scheduledStart)
      payload.scheduled_start = new Date(scheduledStart).toISOString();
    if (scheduledEnd)
      payload.scheduled_end = new Date(scheduledEnd).toISOString();
    if (title) payload.title = title;

    const res = await fetch(`/api/admin/leads/${lead.id}/workflow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError((body as { error?: string }).error ?? "Something went wrong.");
      return;
    }

    setInlineForm(null);
    setNotes("");
    onUpdate();
  }

  async function markDone() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed_at: new Date().toISOString() }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not mark as done.");
      return;
    }
    onUpdate();
  }

  return (
    <div
      className={`rounded-2xl border p-4 transition-opacity ${
        isDone
          ? "border-slate-200 bg-white opacity-60"
          : "border-slate-200 bg-white shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold text-navy text-sm">
            {lead.first_name} {lead.last_name}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{lead.service_name}</p>
          {lead.location_address && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {lead.location_address}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date(lead.created_at).toLocaleDateString()}
          </p>
          {lead.quoted_amount != null && (
            <p className="text-xs font-semibold text-amber-700 mt-1">
              {formatCurrency(lead.quoted_amount)}
            </p>
          )}
        </div>
        {lead.scheduled_job_id && !isDone && (
          <span className="shrink-0 rounded-lg bg-green-50 border border-green-200 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
            On cal
          </span>
        )}
      </div>

      {lead.message && (
        <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 line-clamp-2">
          {lead.message}
        </p>
      )}

      {error && <p className="mt-2 text-xs text-brand-red">{error}</p>}

      {/* Inline quote form */}
      {inlineForm === "quote" && (
        <div className="mt-3 space-y-2">
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Quote amount ($)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            autoFocus
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for customer (optional)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-navy text-white hover:bg-navy/90"
              onClick={() => runWorkflow("quote")}
              disabled={busy || !amount}
            >
              {busy ? "Sending..." : "Send quote"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setInlineForm(null); setNotes(""); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Inline schedule form */}
      {inlineForm === "schedule" && (
        <div className="mt-3 space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Job title"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={scheduledStart}
            onChange={(e) => setScheduledStart(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            autoFocus
          />
          <input
            type="datetime-local"
            value={scheduledEnd}
            onChange={(e) => setScheduledEnd(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-navy text-white hover:bg-navy/90"
              onClick={() => runWorkflow("schedule")}
              disabled={busy || !scheduledStart}
            >
              {busy ? "Scheduling..." : "Schedule job"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setInlineForm(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {inlineForm === null && !isDone && (
        <div className="mt-3 flex flex-wrap gap-2">
          {lead.status === "new" && (
            <>
              <Button
                size="sm"
                className="bg-navy text-white hover:bg-navy/90"
                onClick={() => { setAmount(""); setInlineForm("quote"); }}
              >
                Quote
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => runWorkflow("reject")}
                disabled={busy}
              >
                Reject
              </Button>
            </>
          )}
          {lead.status === "quoted" && (
            <>
              <Button
                size="sm"
                className="bg-navy text-white hover:bg-navy/90"
                onClick={() => setInlineForm("schedule")}
              >
                Schedule
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAmount(lead.quoted_amount?.toString() ?? "");
                  setInlineForm("quote");
                }}
              >
                Revise
              </Button>
            </>
          )}
          {lead.status === "approved" && (
            <Button
              size="sm"
              className="bg-navy text-white hover:bg-navy/90"
              onClick={() => setInlineForm("schedule")}
            >
              Schedule
            </Button>
          )}
          {lead.status === "scheduled" && (
            <>
              <Button
                size="sm"
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={markDone}
                disabled={busy}
              >
                {busy ? "Saving..." : "Mark Done"}
              </Button>
              {lead.scheduled_job_id && (
                <a href={`/api/admin/jobs/${lead.scheduled_job_id}/ics`} download>
                  <Button size="sm" variant="outline" type="button">
                    📅 Add to Calendar
                  </Button>
                </a>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/admin/sections/LeadCard.tsx
git commit -m "feat: add LeadCard with inline quote/schedule/mark-done actions"
```

---

## Task 13: LeadsPipeline

**Files:**
- Create: `components/admin/sections/LeadsPipeline.tsx`

- [ ] **Step 1: Create component**

```tsx
"use client";

import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { LeadRecord } from "@/lib/types";
import LeadCard from "./LeadCard";

type Column = "new" | "quoted" | "approved" | "scheduled" | "done";

const COLUMNS: { key: Column; label: string; badgeClass: string }[] = [
  { key: "new", label: "New", badgeClass: "bg-slate-200 text-slate-700" },
  { key: "quoted", label: "Quoted", badgeClass: "bg-amber-100 text-amber-800" },
  { key: "approved", label: "Approved", badgeClass: "bg-blue-100 text-blue-800" },
  { key: "scheduled", label: "Scheduled", badgeClass: "bg-green-100 text-green-800" },
  { key: "done", label: "Done", badgeClass: "bg-slate-100 text-slate-500" },
];

const LEAD_SELECT =
  "id, first_name, last_name, phone, email, service_id, service_name, location_address, location_lat, location_lng, message, status, internal_notes, quoted_amount, estimate_sent_at, approved_at, rejected_at, scheduled_job_id, completed_at, created_at";

function getColumn(lead: LeadRecord): Column {
  if (lead.completed_at != null) return "done";
  if (lead.status === "rejected") return "done";
  return lead.status as Column;
}

export default function LeadsPipeline() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showDone, setShowDone] = useState(false);
  const deferred = useDeferredValue(search);

  async function loadLeads() {
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("leads")
      .select(LEAD_SELECT)
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      startTransition(() => setLeads((data ?? []) as LeadRecord[]));
    }
    setLoading(false);
  }

  useEffect(() => { void loadLeads(); }, []);

  const filtered = leads.filter((lead) => {
    const term = deferred.trim().toLowerCase();
    if (!term) return true;
    return [
      lead.first_name,
      lead.last_name,
      lead.email,
      lead.phone,
      lead.service_name,
      lead.status,
      lead.location_address ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(term);
  });

  const byColumn = (col: Column) => filtered.filter((l) => getColumn(l) === col);
  const activeLeads = leads.filter((l) => l.completed_at == null && l.status !== "rejected");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-navy">Leads Pipeline</h2>
          <p className="text-sm text-slate-500 mt-1">
            {activeLeads.filter((l) => l.status === "new").length} new ·{" "}
            {activeLeads.filter((l) => l.status === "quoted").length} quoted ·{" "}
            {activeLeads.filter((l) => l.status === "scheduled").length} scheduled
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads..."
          className="w-64 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm text-brand-red">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const cards = byColumn(col.key);
            const isDoneCol = col.key === "done";

            return (
              <div key={col.key} className="min-w-[200px] flex-1">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {col.label}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${col.badgeClass}`}
                  >
                    {cards.length}
                  </span>
                </div>

                {isDoneCol && !showDone && cards.length > 0 ? (
                  <button
                    className="w-full rounded-xl border border-dashed border-slate-200 py-4 text-xs text-slate-400 hover:text-slate-600"
                    onClick={() => setShowDone(true)}
                  >
                    Show {cards.length} completed →
                  </button>
                ) : (
                  <div className="space-y-3">
                    {cards.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} onUpdate={loadLeads} />
                    ))}
                    {cards.length === 0 && (
                      <div className="rounded-xl border-2 border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
                        Empty
                      </div>
                    )}
                    {isDoneCol && showDone && (
                      <button
                        className="w-full text-xs text-slate-400 hover:text-slate-600 py-2"
                        onClick={() => setShowDone(false)}
                      >
                        ← Collapse
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/admin/sections/LeadsPipeline.tsx
git commit -m "feat: add LeadsPipeline kanban board"
```

---

## Task 14: Replace AdminDashboard with AdminShell

**Files:**
- Modify: `components/admin/AdminDashboard.tsx`

- [ ] **Step 1: Replace contents of `AdminDashboard.tsx`**

The page at `app/portal/dashboard/page.tsx` already imports `AdminDashboard` with `initialAdminEmail` prop. Keep the same export name and prop signature — replace all internals.

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import OverviewSection from "./sections/OverviewSection";
import LeadsPipeline from "./sections/LeadsPipeline";
import CalendarSection from "./sections/CalendarSection";
import ServicesSection from "./sections/ServicesSection";
import GallerySection from "./sections/GallerySection";

type Section = "overview" | "leads" | "calendar" | "services" | "gallery";

const NAV: { key: Section; label: string; emoji: string }[] = [
  { key: "overview", label: "Overview", emoji: "📊" },
  { key: "leads", label: "Leads", emoji: "📥" },
  { key: "calendar", label: "Calendar", emoji: "📅" },
  { key: "services", label: "Services", emoji: "🔧" },
  { key: "gallery", label: "Gallery", emoji: "🖼" },
];

export default function AdminDashboard({
  initialAdminEmail,
}: {
  initialAdminEmail: string;
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/portal");
    router.refresh();
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 bg-navy flex flex-col py-6 px-3 gap-1">
        <p className="px-3 mb-4 text-[10px] font-bold uppercase tracking-widest text-blue-300">
          SudsOnWheels
        </p>

        {NAV.map((item) => (
          <button
            key={item.key}
            onClick={() => setSection(item.key)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left ${
              section === item.key
                ? "bg-white/15 text-white"
                : "text-blue-200 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        ))}

        <div className="mt-auto">
          <p className="px-3 mb-2 text-[10px] text-blue-400 truncate">
            {initialAdminEmail}
          </p>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-blue-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span>🚪</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-slate-50 p-8">
        {section === "overview" && <OverviewSection />}
        {section === "leads" && <LeadsPipeline />}
        {section === "calendar" && <CalendarSection />}
        {section === "services" && <ServicesSection />}
        {section === "gallery" && <GallerySection />}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Also update the portal dashboard page to remove the outer padding** (the page adds `px-6 py-10` but the sidebar layout should flush to the edge)

In `app/portal/dashboard/page.tsx`, change:

```tsx
// Before:
<main className="min-h-[calc(100vh-8rem)] bg-slate-50 px-6 py-10">
  <div className="mx-auto max-w-7xl">
    <AdminDashboard initialAdminEmail={adminIdentity.email} />
  </div>
</main>

// After:
<main className="min-h-[calc(100vh-8rem)]">
  <AdminDashboard initialAdminEmail={adminIdentity.email} />
</main>
```

- [ ] **Step 3: Full type-check and lint**

```bash
npm run type-check && npm run lint
```
Expected: no errors

- [ ] **Step 4: Start dev server and visually verify**

```bash
npm run dev
```

Open `http://localhost:3000/portal`, sign in, and verify:
- Sidebar renders with 5 nav items
- Overview section shows stats and recent activity
- Leads section shows pipeline with 5 columns
- Calendar section shows month grid with "+ Calendar" links on job chips
- Services section shows service list with add form
- Gallery section shows gallery list with upload form
- Sign out navigates to `/portal`

- [ ] **Step 5: Commit**

```bash
git add components/admin/AdminDashboard.tsx app/portal/dashboard/page.tsx
git commit -m "feat: replace AdminDashboard monolith with sidebar shell and section components"
```

---

## Task 15: Final verification

- [ ] **Step 1: Full build**

```bash
npm run build
```
Expected: build completes with no type or lint errors

- [ ] **Step 2: Run E2E tests**

```bash
npm run test:e2e
```
Expected: all existing tests pass (dashboard login flow, public pages)

- [ ] **Step 3: Commit any fixes, then push branch**

```bash
git push origin dev
```
