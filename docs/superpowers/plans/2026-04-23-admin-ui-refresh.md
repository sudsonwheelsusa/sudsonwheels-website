# Admin UI Refresh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the admin dashboard to match the marketing site's brand language — off-white backgrounds, small-caps red eyebrow labels, SVG nav icons, editorial stats bar, flat badges, tighter radius.

**Architecture:** Pure component restyling — no new files, no backend changes. Each file touched is self-contained. Implement one component at a time, type-check after each, visual-verify at the end.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, TypeScript. No unit test framework — verify with `npx tsc --noEmit` and visual inspection on the dev server.

---

### Task 1: Restyle AdminDashboard.tsx — sidebar + shell

**Files:**
- Modify: `components/admin/AdminDashboard.tsx`

- [ ] **Step 1: Replace the NAV array and add SVG icons**

Open `components/admin/AdminDashboard.tsx`. Replace the entire file content with:

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
import SettingsSection from "./sections/SettingsSection";

type Section = "overview" | "leads" | "calendar" | "services" | "gallery" | "settings";

const NAV_ICONS: Record<Section, React.ReactNode> = {
  overview: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  leads: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  calendar: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  services: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 0-14.14 0" /><path d="M4.93 19.07a10 10 0 0 0 14.14 0" />
    </svg>
  ),
  gallery: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  settings: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
};

const NAV: { key: Section; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "leads", label: "Leads" },
  { key: "calendar", label: "Calendar" },
  { key: "services", label: "Services" },
  { key: "gallery", label: "Gallery" },
  { key: "settings", label: "Settings" },
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
    <div className="flex flex-col min-h-screen">
      {/* Mobile top nav */}
      <div className="md:hidden bg-navy border-b border-white/10">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-[11px] font-black tracking-tight text-white">
            Suds<span className="text-brand-red">On</span>Wheels
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1"
          >
            Sign out
          </button>
        </div>
        <div className="flex overflow-x-auto gap-0.5 px-3 pb-2 scrollbar-none">
          {NAV.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSection(item.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-[11.5px] font-medium transition-colors whitespace-nowrap ${
                section === item.key
                  ? "bg-white/10 text-white border-b-2 border-brand-red rounded-b-none"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {NAV_ICONS[item.key]}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-48 shrink-0 bg-navy flex-col py-5 px-3 gap-0.5">
          <div className="px-2.5 mb-5 pb-4 border-b border-white/10">
            <p className="text-[13px] font-black tracking-tight text-white">
              Suds<span className="text-brand-red">On</span>Wheels
            </p>
            <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/25 mt-0.5">
              Admin
            </p>
          </div>

          <p className="px-2.5 mb-2 text-[8px] font-bold uppercase tracking-[0.15em] text-white/22">
            Menu
          </p>

          {NAV.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSection(item.key)}
              className={`flex items-center gap-2.5 rounded-md py-2 text-[12.5px] font-medium transition-colors text-left ${
                section === item.key
                  ? "bg-white/8 text-white border-l-2 border-brand-red pl-[9px] pr-2.5"
                  : "text-white/45 hover:bg-white/5 hover:text-white/75 px-2.5"
              }`}
            >
              {NAV_ICONS[item.key]}
              <span>{item.label}</span>
            </button>
          ))}

          <div className="mt-auto pt-4 border-t border-white/10">
            <p className="px-2.5 mb-2 text-[9px] text-white/25 truncate">
              {initialAdminEmail}
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] text-white/35 hover:bg-white/5 hover:text-white/60 transition-colors"
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-offwhite p-4 sm:p-6 md:p-8">
          {section === "overview" && <OverviewSection />}
          {section === "leads" && <LeadsPipeline />}
          {section === "calendar" && <CalendarSection />}
          {section === "services" && <ServicesSection />}
          {section === "gallery" && <GallerySection />}
          {section === "settings" && <SettingsSection />}
        </main>
      </div>
    </div>
  );
}
```

> Note: `SettingsSection` doesn't exist yet — it will be created in the MFA plan. For now, create a stub so this compiles.

- [ ] **Step 2: Create the SettingsSection stub**

Create `components/admin/sections/SettingsSection.tsx`:

```tsx
export default function SettingsSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-red mb-1">
          Admin Dashboard
        </p>
        <h2 className="text-2xl font-black text-navy tracking-tight">Settings</h2>
        <p className="text-sm text-navy/50 mt-1">Security and account settings.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. If you see `"SettingsSection" not found`, make sure the file was created at the exact path above.

- [ ] **Step 4: Commit**

```bash
git add components/admin/AdminDashboard.tsx components/admin/sections/SettingsSection.tsx
git commit -m "feat(admin): restyle sidebar with SVG icons, brand name, Settings nav"
```

---

### Task 2: Restyle the login page

**Files:**
- Modify: `app/(marketing)/contact/page.tsx` — no, wrong file
- Modify: `app/(admin)/portal/page.tsx`
- Modify: `components/admin/AdminLoginForm.tsx`

- [ ] **Step 1: Update the portal page background**

Open `app/(admin)/portal/page.tsx`. Change the `main` className:

```tsx
// Before:
<main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">

// After:
<main className="flex min-h-screen items-center justify-center bg-offwhite px-6">
```

- [ ] **Step 2: Restyle AdminLoginForm**

Open `components/admin/AdminLoginForm.tsx`. Replace the `return (` block (lines 55–116) with:

```tsx
  return (
    <div>
      <div className="mb-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-red mb-1">
          Admin Portal
        </p>
        <p className="text-xl font-black tracking-tight text-navy">
          Suds<span className="text-brand-red">On</span>Wheels
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-navy/10 bg-white p-6 shadow-sm"
      >
        <div>
          <label
            htmlFor="login-email"
            className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-navy/50"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-navy/15 bg-offwhite px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-brand-red/25 focus:border-brand-red/40"
            placeholder="owner@example.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-navy/50"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-navy/15 bg-offwhite px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-brand-red/25 focus:border-brand-red/40"
            required
          />
        </div>

        <Turnstile
          ref={turnstileRef}
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={(token) => { setTurnstileError(false); setTurnstileToken(token); }}
          onError={() => { setTurnstileError(true); setTurnstileToken(""); }}
          onExpire={() => { setTurnstileError(false); setTurnstileToken(""); }}
        />
        {turnstileError ? (
          <p className="text-xs text-brand-red">
            Bot verification failed to load. Try disabling tracking protection or use a different browser.
          </p>
        ) : null}

        {status === "error" ? (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-brand-red">
            {message}
          </p>
        ) : null}

        <Button
          type="submit"
          className="h-11 w-full bg-navy text-white hover:bg-navy/90"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/"(admin)"/portal/page.tsx components/admin/AdminLoginForm.tsx
git commit -m "feat(admin): restyle login page with brand language"
```

---

### Task 3: Restyle OverviewSection

**Files:**
- Modify: `components/admin/sections/OverviewSection.tsx`

- [ ] **Step 1: Replace OverviewSection**

Replace the entire file content:

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

  const activeLeads = leads.filter((l) => l.completed_at == null);
  const newCount = activeLeads.filter((l) => l.status === "new").length;
  const quotedCount = activeLeads.filter((l) => l.status === "quoted").length;
  const scheduledCount = activeLeads.filter((l) => l.status === "scheduled").length;
  const recent = leads.slice(0, 6);

  const statusStyle: Record<string, string> = {
    new: "bg-navy/8 text-navy",
    quoted: "bg-amber-100 text-amber-800",
    approved: "bg-blue-100 text-blue-800",
    scheduled: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-700",
    done: "bg-navy/5 text-navy/35",
  };

  const stats = [
    { label: "New Leads", value: newCount, alert: true, sub: "needs follow-up" },
    { label: "Quotes Sent", value: quotedCount, alert: false, sub: "awaiting approval" },
    { label: "Scheduled", value: scheduledCount, alert: false, sub: "this week" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-red mb-1">
          Admin Dashboard
        </p>
        <h2 className="text-2xl font-black text-navy tracking-tight">Overview</h2>
        <p className="text-sm text-navy/45 mt-1">Welcome back. Here&apos;s what&apos;s active.</p>
      </div>

      {/* Joined stats bar */}
      <div className="flex bg-white border border-navy/10 rounded-lg overflow-hidden">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex-1 px-5 py-4 ${i < stats.length - 1 ? "border-r border-navy/8" : ""}`}
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-navy/40">
              {stat.label}
            </p>
            <p
              className={`text-3xl font-black mt-1.5 tracking-tight ${
                stat.alert && !loading && stat.value > 0 ? "text-brand-red" : "text-navy"
              }`}
            >
              {loading ? "—" : stat.value}
            </p>
            <p className="text-[9px] text-navy/35 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent leads table */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-navy/40 mb-3">
          Recent Leads
        </p>
        <div className="bg-white border border-navy/10 rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr_90px_72px] gap-2 px-4 py-2.5 border-b border-navy/7">
            {["Customer", "Status", "Date"].map((h) => (
              <span key={h} className="text-[8px] font-bold uppercase tracking-[0.15em] text-navy/35">
                {h}
              </span>
            ))}
          </div>

          {loading ? (
            <p className="px-4 py-6 text-sm text-navy/30">Loading...</p>
          ) : recent.length === 0 ? (
            <p className="px-4 py-6 text-sm text-navy/30">No leads yet.</p>
          ) : (
            recent.map((lead) => {
              const displayStatus = lead.completed_at ? "done" : lead.status;
              return (
                <div
                  key={lead.id}
                  className="grid grid-cols-[1fr_90px_72px] gap-2 px-4 py-3 border-b border-navy/5 last:border-0 items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-navy">
                      {lead.first_name} {lead.last_name}
                    </p>
                    <p className="text-[10px] text-navy/45 mt-0.5">{lead.service_name}</p>
                  </div>
                  <div>
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] ${
                        statusStyle[displayStatus] ?? statusStyle.new
                      }`}
                    >
                      {displayStatus}
                    </span>
                  </div>
                  <p className="text-[10px] text-navy/40">
                    {new Date(lead.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/sections/OverviewSection.tsx
git commit -m "feat(admin): restyle overview — joined stats bar + lead table"
```

---

### Task 4: Restyle LeadCard + LeadsPipeline

**Files:**
- Modify: `components/admin/sections/LeadCard.tsx`
- Modify: `components/admin/sections/LeadsPipeline.tsx`

- [ ] **Step 1: Restyle LeadCard**

Open `components/admin/sections/LeadCard.tsx`. Make these targeted changes:

1. Change the outer `div` className (line ~85):
```tsx
// Before:
className={`rounded-2xl border p-4 transition-opacity ${
  isDone
    ? "border-slate-200 bg-white opacity-60"
    : "border-slate-200 bg-white shadow-sm"
}`}

// After:
className={`rounded-lg border p-3.5 transition-opacity ${
  isDone
    ? "border-navy/8 bg-white opacity-50"
    : "border-navy/10 bg-white shadow-sm"
}`}
```

2. Change the message bubble className (line ~119):
```tsx
// Before:
className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 line-clamp-2"

// After:
className="mt-2 rounded-md bg-offwhite px-3 py-2 text-xs text-navy/55 line-clamp-2"
```

3. Change all inline form input classNames from `rounded-xl border border-slate-200 px-3 py-2 text-sm` to `rounded-md border border-navy/15 px-3 py-2 text-sm` (there are 4 inputs total — the amount input, notes input, title input, and two datetime inputs).

4. Change the "On cal" badge (line ~112):
```tsx
// Before:
className="shrink-0 rounded-lg bg-green-50 border border-green-200 px-1.5 py-0.5 text-[10px] font-semibold text-green-700"

// After:
className="shrink-0 rounded bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-emerald-800"
```

5. Change `text-xs text-slate-500` on the service name (line ~97) to `text-xs text-navy/45`.

6. Change `text-xs text-slate-400` on location + date (lines ~100, 104) to `text-[10px] text-navy/35`.

7. Change `text-xs font-semibold text-amber-700` on quoted amount to `text-xs font-bold text-navy`.

- [ ] **Step 2: Restyle LeadsPipeline**

Open `components/admin/sections/LeadsPipeline.tsx`. Make these targeted changes:

1. Replace the `COLUMNS` array (lines 10–16):
```tsx
const COLUMNS: { key: Column; label: string; badgeClass: string }[] = [
  { key: "new", label: "New", badgeClass: "bg-navy/8 text-navy" },
  { key: "quoted", label: "Quoted", badgeClass: "bg-amber-100 text-amber-800" },
  { key: "approved", label: "Approved", badgeClass: "bg-blue-100 text-blue-800" },
  { key: "scheduled", label: "Scheduled", badgeClass: "bg-emerald-100 text-emerald-800" },
  { key: "done", label: "Done", badgeClass: "bg-navy/5 text-navy/35" },
];
```

2. Change the column header span (line ~109):
```tsx
// Before:
<span className="text-xs font-bold uppercase tracking-wider text-slate-500">
  {col.label}
</span>

// After:
<span className="text-[9px] font-bold uppercase tracking-[0.15em] text-navy/40">
  {col.label}
</span>
```

3. Change the badge span (line ~112):
```tsx
// Before:
<span className={`rounded-full px-2 py-0.5 text-xs font-bold ${col.badgeClass}`}>
  {cards.length}
</span>

// After:
<span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] ${col.badgeClass}`}>
  {cards.length}
</span>
```

4. Change the empty state div (line ~132):
```tsx
// Before:
<div className="rounded-xl border-2 border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">

// After:
<div className="rounded-lg border border-dashed border-navy/15 py-6 text-center text-[11px] text-navy/30">
```

5. Change the "Show N completed" button (line ~121):
```tsx
// Before:
className="w-full rounded-xl border border-dashed border-slate-200 py-4 text-xs text-slate-400 hover:text-slate-600"

// After:
className="w-full rounded-lg border border-dashed border-navy/15 py-4 text-xs text-navy/35 hover:text-navy/60"
```

6. Change the search input (line ~84):
```tsx
// Before:
className="w-full sm:w-64 rounded-xl border border-slate-200 px-3 py-2 text-sm"

// After:
className="w-full sm:w-64 rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-brand-red/25"
```

7. Change the heading style (line ~78):
```tsx
// Before:
<h2 className="text-2xl font-black text-navy">Leads Pipeline</h2>
<p className="text-sm text-slate-500 mt-1">

// After:
<p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-red mb-1">Leads Pipeline</p>
<h2 className="text-2xl font-black text-navy tracking-tight">Pipeline</h2>
<p className="text-sm text-navy/45 mt-1">
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/admin/sections/LeadCard.tsx components/admin/sections/LeadsPipeline.tsx
git commit -m "feat(admin): restyle leads pipeline and cards"
```

---

### Task 5: Restyle CalendarSection

**Files:**
- Modify: `components/admin/sections/CalendarSection.tsx`

- [ ] **Step 1: Add today detection and restyle the grid**

Open `components/admin/sections/CalendarSection.tsx`. Make these targeted changes:

1. Add a `today` variable inside the component (before the `gridDays` line):
```tsx
const today = new Date();
const isToday = (day: Date) =>
  day.getFullYear() === today.getFullYear() &&
  day.getMonth() === today.getMonth() &&
  day.getDate() === today.getDate();
```

2. Change the heading block (lines ~49–52):
```tsx
// Before:
<h2 className="text-2xl font-black text-navy">Job Calendar</h2>
<p className="text-sm text-slate-500 mt-1">Approved jobs appear here once scheduled.</p>

// After:
<p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-red mb-1">Admin Dashboard</p>
<h2 className="text-2xl font-black text-navy tracking-tight">Job Calendar</h2>
<p className="text-sm text-navy/45 mt-1">Scheduled jobs appear here.</p>
```

3. Change the day-of-week header row (line ~81):
```tsx
// Before:
<div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">

// After:
<div className="grid grid-cols-7 gap-1.5 text-center text-[8px] font-bold uppercase tracking-[0.12em] text-navy/35">
```

4. Change the grid container gap (line ~87):
```tsx
// Before:
<div className="grid grid-cols-7 gap-2">

// After:
<div className="grid grid-cols-7 gap-1.5">
```

5. Replace the cell `div` className logic (lines ~99–104):
```tsx
// Before:
className={`min-h-28 rounded-2xl border p-2 text-left ${
  isCurrentMonth
    ? "border-slate-200 bg-white"
    : "border-slate-100 bg-slate-50"
}`}

// After:
className={`min-h-24 rounded-md border p-2 text-left ${
  !isCurrentMonth
    ? "border-navy/5 bg-navy/[0.02]"
    : isToday(day)
    ? "border-brand-red bg-white"
    : "border-navy/8 bg-white"
}`}
```

6. Change the date number paragraph (line ~108):
```tsx
// Before:
<p className="text-xs font-semibold text-slate-400">{day.getDate()}</p>

// After:
<p className={`text-[10px] font-semibold ${isToday(day) ? "text-brand-red font-bold" : "text-navy/35"}`}>
  {day.getDate()}
</p>
```

7. Change the job event chip (lines ~110–127):
```tsx
// Before:
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

// After:
<div
  key={job.id}
  className="rounded-sm bg-navy px-1.5 py-1 mt-1"
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
```

> The `.ics` download link is removed from the chip — it still works from the LeadCard. The Calendar section will get Google sync in the next plan.

8. Change nav buttons to use brand style:
```tsx
// The two Prev/Next Button components — they already use shadcn Button with variant="outline", which is fine. No change needed.
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/sections/CalendarSection.tsx
git commit -m "feat(admin): restyle calendar grid — on-brand cells and event chips"
```

---

### Task 6: Restyle ServicesSection

**Files:**
- Modify: `components/admin/sections/ServicesSection.tsx`

- [ ] **Step 1: Make targeted style changes**

Open `components/admin/sections/ServicesSection.tsx`. Make these changes:

1. Change the heading block (lines ~76–79):
```tsx
// Before:
<h2 className="text-2xl font-black text-navy">Services</h2>
<p className="text-sm text-slate-500 mt-1">Add, pause, or remove public service offerings.</p>

// After:
<p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-red mb-1">Admin Dashboard</p>
<h2 className="text-2xl font-black text-navy tracking-tight">Services</h2>
<p className="text-sm text-navy/45 mt-1">Add, pause, or remove public service offerings.</p>
```

2. Change the error paragraph (line ~83):
```tsx
// Before:
className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-brand-red"

// After:
className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-brand-red"
```

3. Change the add form container (line ~88):
```tsx
// Before:
className="grid gap-3 rounded-2xl bg-slate-50 p-4"

// After:
className="grid gap-3 rounded-lg bg-white border border-navy/10 p-4"
```

4. Change all input/select/textarea classNames from `rounded-xl border border-slate-200` to `rounded-md border border-navy/15 bg-offwhite`:
```tsx
// inputs + select + textarea — all 4 elements
className="... rounded-md border border-navy/15 bg-offwhite px-3 py-2.5 text-sm"
```

5. Change the service item card (line ~134):
```tsx
// Before:
className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between"

// After:
className="flex flex-col gap-4 rounded-lg border border-navy/10 bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
```

6. Change the service icon container (line ~137):
```tsx
// Before:
className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 shrink-0"

// After:
className="flex size-10 items-center justify-center rounded-lg bg-navy/6 shrink-0"
```

7. Change `text-sm text-slate-500` on description to `text-sm text-navy/50`.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/sections/ServicesSection.tsx
git commit -m "feat(admin): restyle services section"
```

---

### Task 7: Visual verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open the admin portal**

Navigate to `http://localhost:3000/portal`. Sign in. Verify:
- [ ] Login page has off-white background, navy/red eyebrow label, brand name with red "On"
- [ ] Sidebar shows SVG icons, `SudsOnWheels` brand name, `Admin` sub-label, Settings nav item
- [ ] Active nav item has red left border (not white highlight blob)
- [ ] Main content area is off-white (not slate-50)
- [ ] Overview shows joined stats bar (3 stats side by side, divided by thin border)
- [ ] New Leads count is red when non-zero
- [ ] Recent activity is a table (Customer / Status / Date columns with small-caps headers)
- [ ] Leads Pipeline has smaller column headers with tracking, flat badges (not pills)
- [ ] Calendar cells are rounded-md, today has red border
- [ ] Job chips are navy solid with white text
- [ ] Services section has white form card, on-brand inputs

- [ ] **Step 3: Final type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(admin): complete UI refresh — brand language across all admin sections"
```
