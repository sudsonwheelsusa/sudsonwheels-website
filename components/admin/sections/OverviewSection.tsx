"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { LeadRecord, JobRecord } from "@/lib/types";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  quoted: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  scheduled: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  done: "bg-navy/8 text-navy/50",
};

export default function OverviewSection() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [nextJob, setNextJob] = useState<JobRecord | null>(null);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [leadsRes, jobsRes, completedJobsRes] = await Promise.all([
        supabase
          .from("leads")
          .select("id, first_name, last_name, service_name, status, completed_at, quoted_amount, created_at")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("jobs")
          .select("id, lead_id, estimate_id, parent_job_id, title, status, scheduled_start, scheduled_end, service_name, customer_name, location_address, location_lat, location_lng, notes, recurrence_rule, units_completed, rate_per_unit, total_revenue, created_by, created_at, gcal_event_id, gcal_synced_at")
          .eq("status", "scheduled")
          .gte("scheduled_start", new Date().toISOString())
          .order("scheduled_start", { ascending: true })
          .limit(1),
        supabase
          .from("jobs")
          .select("total_revenue")
          .eq("status", "completed")
          .not("total_revenue", "is", null),
      ]);

      const allLeads = (leadsRes.data ?? []) as LeadRecord[];
      setLeads(allLeads);

      // Total earned: completed leads (quoted_amount) + completed jobs (total_revenue)
      const leadEarned = allLeads
        .filter((l) => l.completed_at != null && l.quoted_amount != null)
        .reduce((sum, l) => sum + (l.quoted_amount ?? 0), 0);
      const jobEarned = (completedJobsRes.data ?? [])
        .reduce((sum, j) => sum + ((j.total_revenue as number | null) ?? 0), 0);
      setTotalEarned(leadEarned + jobEarned);

      if (jobsRes.data && jobsRes.data.length > 0) {
        setNextJob(jobsRes.data[0] as JobRecord);
      }

      setLoading(false);
    }
    void load();
  }, []);

  const activeLeads = leads.filter((l) => l.completed_at == null);
  const newCount = activeLeads.filter((l) => l.status === "new").length;
  const quotedCount = activeLeads.filter((l) => l.status === "quoted").length;
  const scheduledCount = activeLeads.filter((l) => l.status === "scheduled").length;
  const completedCount = leads.filter((l) => l.completed_at != null).length;
  const recentLeads = leads.slice(0, 8);

  // Pipeline breakdown
  const total = leads.length || 1;
  const pipeline = [
    { key: "new", label: "NEW", count: leads.filter((l) => l.status === "new").length, color: "bg-slate-400" },
    { key: "quoted", label: "QUOTED", count: leads.filter((l) => l.status === "quoted").length, color: "bg-amber-400" },
    { key: "approved", label: "APPROVED", count: leads.filter((l) => l.status === "approved").length, color: "bg-blue-500" },
    { key: "scheduled", label: "SCHEDULED", count: leads.filter((l) => l.status === "scheduled").length, color: "bg-emerald-500" },
    { key: "done", label: "DONE", count: leads.filter((l) => l.completed_at != null).length, color: "bg-navy" },
  ];

  const statCards = [
    {
      label: "NEW LEADS",
      value: newCount,
      sub: `${leads.filter((l) => l.status === "new").length} total`,
      accent: "bg-blue-500",
      icon: (
        <svg className="h-5 w-5 text-navy/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
        </svg>
      ),
    },
    {
      label: "QUOTES SENT",
      value: quotedCount,
      sub: "Awaiting approval",
      accent: "bg-amber-400",
      icon: (
        <svg className="h-5 w-5 text-navy/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      label: "SCHEDULED",
      value: scheduledCount,
      sub: "Upcoming jobs",
      accent: "bg-emerald-500",
      icon: (
        <svg className="h-5 w-5 text-navy/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5m-9-6h.008v.008H12V12zm0 3h.008v.008H12V15zm0 3h.008v.008H12V18zm-3-6h.008v.008H9V12zm0 3h.008v.008H9V15zm0 3h.008v.008H9V18zm6-6h.008v.008H15V12zm0 3h.008v.008H15V15zm0 3h.008v.008H15V18z" />
        </svg>
      ),
    },
    {
      label: "COMPLETED",
      value: completedCount,
      sub: "Jobs finished",
      accent: "bg-navy",
      icon: (
        <svg className="h-5 w-5 text-navy/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-navy/40 font-medium mb-1">{getFormattedDate()}</p>
          <h2 className="text-2xl font-black text-navy tracking-tight">
            {getGreeting()} 👋
          </h2>
          <p className="text-sm text-navy/50 mt-1">Here&apos;s what&apos;s happening with your business.</p>
        </div>
        {!loading && totalEarned > 0 && (
          <div className="text-right shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy/40">Total earned</p>
            <p className="text-xl font-black text-navy">
              ${totalEarned.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        )}
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-navy/8">
            <div className={`h-1 w-full ${card.accent}`} />
            <div className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] text-navy/40 truncate">
                    {card.label}
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-navy tracking-tight mt-1">
                    {loading ? "—" : card.value}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-navy/40 mt-1 truncate">{card.sub}</p>
                </div>
                <div className="rounded-xl border border-navy/10 p-1.5 mt-0.5 shrink-0 hidden sm:flex">
                  {card.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Middle row: Pipeline / Upcoming Jobs / Google Calendar */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        {/* Pipeline Breakdown */}
        <div className="bg-white rounded-2xl border border-navy/8 shadow-sm p-5">
          <h3 className="text-sm font-bold text-navy mb-4">Pipeline Breakdown</h3>
          <div className="space-y-3">
            {pipeline.map((row) => {
              const pct = Math.round((row.count / total) * 100);
              return (
                <div key={row.key} className="flex items-center gap-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-navy/50 w-16 shrink-0">
                    {row.label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-navy/8 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.color} w-(--bar-w)`}
                      style={{ "--bar-w": `${pct}%` } as React.CSSProperties}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-navy/50 w-4 shrink-0 text-right">
                    {row.count}
                  </span>
                  <span className="text-[9px] text-navy/35 w-7 shrink-0 text-right">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Jobs */}
        <div className="bg-white rounded-2xl border border-navy/8 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-navy">Upcoming Jobs</h3>
            <svg className="h-4 w-4 text-navy/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
          </div>
          {loading ? (
            <p className="text-sm text-navy/30">Loading...</p>
          ) : nextJob ? (
            <div className="flex gap-3 items-start bg-offwhite rounded-xl p-3">
              <div className="shrink-0 bg-navy rounded-xl w-12 text-center py-1.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/60">
                  {new Date(nextJob.scheduled_start).toLocaleString("en-US", { month: "short" })}
                </p>
                <p className="text-lg font-black text-white leading-none">
                  {new Date(nextJob.scheduled_start).getDate()}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy truncate">{nextJob.customer_name}</p>
                <p className="text-[10px] text-navy/50 mt-0.5">
                  {new Date(nextJob.scheduled_start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <svg className="h-3 w-3 text-navy/40 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <p className="text-[10px] text-navy/50 truncate">{nextJob.service_name}</p>
                </div>
                {nextJob.location_address && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <svg className="h-3 w-3 text-navy/40 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <p className="text-[10px] text-navy/50 truncate">{nextJob.location_address}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <svg className="h-8 w-8 text-navy/20 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
              <p className="text-xs text-navy/40">No upcoming jobs</p>
            </div>
          )}
        </div>

        {/* Google Calendar */}
        <div className="bg-white rounded-2xl border border-navy/8 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-navy">Google Calendar</h3>
            <svg className="h-4 w-4 text-navy/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
          </div>
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="rounded-full bg-navy/6 p-3 mb-3">
              <svg className="h-6 w-6 text-navy/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-navy mb-1">Not connected</p>
            <p className="text-[10px] text-navy/45 mb-3 leading-relaxed">
              Connect your Google Calendar in the Calendar section to sync jobs automatically.
            </p>
            <button
              type="button"
              onClick={() => {
                // Signal parent to switch to calendar section — handled via custom event
                window.dispatchEvent(new CustomEvent("admin-navigate", { detail: "calendar" }));
              }}
              className="text-[11px] font-semibold text-navy underline underline-offset-2 hover:text-brand-red transition-colors"
            >
              Open Calendar →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-navy">Recent Leads</p>
          <span className="text-[10px] text-navy/40">{leads.length} total</span>
        </div>
        <div className="bg-white rounded-2xl border border-navy/8 shadow-sm overflow-hidden">
          {loading ? (
            <p className="px-5 py-6 text-sm text-navy/30">Loading...</p>
          ) : recentLeads.length === 0 ? (
            <p className="px-5 py-6 text-sm text-navy/30">No leads yet.</p>
          ) : (
            recentLeads.map((lead, i) => {
              const displayStatus = lead.completed_at ? "done" : lead.status;
              const fullName = `${lead.first_name} ${lead.last_name}`;
              return (
                <div
                  key={lead.id}
                  className={`flex items-center gap-3 px-5 py-3.5 ${i < recentLeads.length - 1 ? "border-b border-navy/5" : ""}`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy/8 text-[11px] font-black text-navy">
                    {getInitials(fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy truncate">{fullName}</p>
                    <p className="text-[10px] text-navy/45 mt-0.5">{lead.service_name}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] ${STATUS_COLORS[displayStatus] ?? STATUS_COLORS.new}`}>
                      {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                    </span>
                    <p className="text-[10px] text-navy/40 hidden sm:block">
                      {new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    {lead.quoted_amount != null && (
                      <p className="text-xs font-bold text-navy">
                        ${lead.quoted_amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
