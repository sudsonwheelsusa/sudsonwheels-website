"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import type { JobRecord } from "@/lib/types";

async function cancelJob(jobId: string): Promise<boolean> {
  const res = await fetch(`/api/admin/jobs/${jobId}`, { method: "DELETE" });
  return res.ok;
}

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
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  async function loadJobs() {
    const supabase = createClient();
    const { data } = await supabase
      .from("jobs")
      .select("id, lead_id, estimate_id, title, status, scheduled_start, scheduled_end, service_name, customer_name, location_address, location_lat, location_lng, notes, created_by, created_at")
      .order("scheduled_start", { ascending: true });
    setJobs((data ?? []) as JobRecord[]);
    setLoading(false);
  }

  useEffect(() => { void loadJobs(); }, []);

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
                        <div className="mt-1 flex items-center gap-2">
                          <a
                            href={`/api/admin/jobs/${job.id}/ics`}
                            download
                            className="text-[10px] font-semibold text-navy underline underline-offset-2 hover:text-navy/70"
                          >
                            + Calendar
                          </a>
                          <button
                            type="button"
                            disabled={cancellingId === job.id}
                            onClick={async () => {
                              if (!confirm(`Cancel job for ${job.customer_name}? This will return the lead to the pipeline.`)) return;
                              setCancellingId(job.id);
                              const ok = await cancelJob(job.id);
                              setCancellingId(null);
                              if (ok) void loadJobs();
                            }}
                            className="text-[10px] font-semibold text-red-500 underline underline-offset-2 hover:text-red-700 disabled:opacity-40"
                          >
                            {cancellingId === job.id ? "Cancelling…" : "Cancel"}
                          </button>
                        </div>
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
