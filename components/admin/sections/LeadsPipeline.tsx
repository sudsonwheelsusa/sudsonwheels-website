"use client";

import { startTransition, useCallback, useDeferredValue, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { LeadRecord } from "@/lib/types";
import LeadCard from "./LeadCard";

type Column = "new" | "quoted" | "approved" | "scheduled" | "done";

const COLUMNS: { key: Column; label: string; badgeClass: string }[] = [
  { key: "new", label: "New", badgeClass: "bg-navy/8 text-navy" },
  { key: "quoted", label: "Quoted", badgeClass: "bg-amber-100 text-amber-800" },
  { key: "approved", label: "Approved", badgeClass: "bg-blue-100 text-blue-800" },
  { key: "scheduled", label: "Scheduled", badgeClass: "bg-emerald-100 text-emerald-800" },
  { key: "done", label: "Done", badgeClass: "bg-navy/5 text-navy/35" },
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

  const loadLeads = useCallback(async () => {
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("leads")
      .select(LEAD_SELECT)
      .order("created_at", { ascending: false })
      .limit(500);

    if (err) {
      setError(err.message);
    } else {
      startTransition(() => setLeads((data ?? []) as LeadRecord[]));
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadLeads(); }, [loadLeads]);

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
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-red mb-1">Leads Pipeline</p>
          <h2 className="text-2xl font-black text-navy tracking-tight">Pipeline</h2>
          <p className="text-sm text-navy/45 mt-1">
            {activeLeads.filter((l) => l.status === "new").length} new ·{" "}
            {activeLeads.filter((l) => l.status === "quoted").length} quoted ·{" "}
            {activeLeads.filter((l) => l.status === "scheduled").length} scheduled
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads..."
          className="w-full sm:w-64 rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-brand-red/25"
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
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-navy/40">
                    {col.label}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] ${col.badgeClass}`}
                  >
                    {cards.length}
                  </span>
                </div>

                {isDoneCol && !showDone && cards.length > 0 ? (
                  <button
                    className="w-full rounded-lg border border-dashed border-navy/15 py-4 text-xs text-navy/35 hover:text-navy/60"
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
                      <div className="rounded-lg border border-dashed border-navy/15 py-6 text-center text-[11px] text-navy/30">
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
