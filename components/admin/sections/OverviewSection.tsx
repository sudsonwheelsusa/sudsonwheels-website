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
