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
                    {dayJobs.map((job) => (
                      <div key={job.id} className="rounded-sm bg-navy px-1.5 py-1 mt-1">
                        <p className="text-[9px] font-semibold text-white truncate">{job.customer_name}</p>
                        <p className="text-[8px] text-white/55 mt-0.5">
                          {new Date(job.scheduled_start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </p>
                        <p className="text-[8px] text-white/55 truncate">{job.service_name}</p>
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
