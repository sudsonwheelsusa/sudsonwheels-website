"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  const [connected, setConnected] = useState<boolean | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const searchParams = useSearchParams();
  const gcalParam = searchParams.get("gcal");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("jobs")
        .select("id, lead_id, estimate_id, title, status, scheduled_start, scheduled_end, service_name, customer_name, location_address, location_lat, location_lng, notes, created_by, created_at, gcal_event_id, gcal_synced_at")
        .order("scheduled_start", { ascending: true });
      setJobs((data ?? []) as JobRecord[]);
      setLoading(false);
    }
    async function checkConnection() {
      const res = await fetch("/api/admin/google/status");
      if (res.ok) {
        const data = (await res.json()) as { connected: boolean };
        setConnected(data.connected);
      }
    }
    void load();
    void checkConnection();
  }, []);

  async function handleDisconnect() {
    if (!window.confirm("Disconnect Google Calendar? Jobs will no longer sync.")) return;
    await fetch("/api/admin/google/disconnect", { method: "DELETE" });
    setConnected(false);
  }

  const gridDays = getMonthGrid(currentMonth);

  const today = new Date();
  const isToday = (day: Date) =>
    day.getFullYear() === today.getFullYear() &&
    day.getMonth() === today.getMonth() &&
    day.getDate() === today.getDate();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-red mb-1">Admin Dashboard</p>
        <h2 className="text-2xl font-black text-navy tracking-tight">Job Calendar</h2>
        <p className="text-sm text-navy/45 mt-1">Scheduled jobs appear here.</p>
      </div>

      {/* Google Calendar connection banner */}
      {connected === false && (
        <div className="flex items-center justify-between rounded-lg border border-brand-red/30 bg-white p-3.5 mb-1">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-navy/10 bg-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#1D3557" strokeWidth="1.5" />
                <line x1="3" y1="10" x2="21" y2="10" stroke="#C8102E" strokeWidth="1.5" />
                <line x1="8" y1="2" x2="8" y2="6" stroke="#1D3557" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="16" y1="2" x2="16" y2="6" stroke="#1D3557" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-navy">Connect Google Calendar</p>
              <p className="text-[10px] text-navy/45 mt-0.5">Sync jobs to contact@sudsonwheelsusa.com automatically</p>
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
              <p className="text-[11px] font-semibold text-emerald-800">Connected — contact@sudsonwheelsusa.com</p>
              <p className="text-[9px] text-emerald-700/70 mt-0.5">Jobs sync automatically · changes on your phone update here</p>
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

      {gcalParam === "connected" && connected === true && (
        <p className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-800">Google Calendar connected. Jobs will now sync automatically.</p>
      )}
      {gcalParam === "error" && (
        <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-brand-red">Could not connect Google Calendar. Check your Google account and try again.</p>
      )}

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
          <div className="grid grid-cols-7 gap-1.5 text-center text-[8px] font-bold uppercase tracking-[0.12em] text-navy/35">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
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
                  className={`min-h-24 rounded-md border p-2 text-left ${
                    !isCurrentMonth
                      ? "border-navy/5 bg-navy/[0.02]"
                      : isToday(day)
                      ? "border-brand-red bg-white"
                      : "border-navy/8 bg-white"
                  }`}
                >
                  <p className={`text-[10px] font-semibold ${isToday(day) ? "text-brand-red font-bold" : "text-navy/35"}`}>
                    {day.getDate()}
                  </p>
                  <div className="mt-1 space-y-1.5">
                    {dayJobs.map((job) => {
                      const fromGoogle =
                        job.gcal_synced_at != null &&
                        new Date(job.gcal_synced_at).getTime() > Date.now() - 6 * 60 * 60 * 1000;

                      return (
                        <div
                          key={job.id}
                          className={`rounded-sm px-1.5 py-1 mt-1 ${
                            fromGoogle ? "bg-[#4285f4]" : "bg-navy"
                          }`}
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
                  </div>
                </div>
              );
            })}
          </div>

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
        </>
      )}
    </div>
  );
}
