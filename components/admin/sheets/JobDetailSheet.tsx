"use client";

import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { JobRecord } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

interface Props {
  job: JobRecord | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function JobDetailSheet({ job, onClose, onUpdated }: Props) {
  const [completing, setCompleting] = useState(false);
  const [units, setUnits] = useState("");
  const [rate, setRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = job !== null;

  const total = units && rate
    ? (parseFloat(units) * parseFloat(rate)).toFixed(2)
    : null;

  const isSeries = job?.parent_job_id !== null && job?.parent_job_id !== undefined;

  async function handleComplete() {
    if (!job) return;
    const unitsInt = parseInt(units, 10);
    if (!units || !rate) { setError("Enter units and rate"); return; }
    if (!Number.isInteger(unitsInt) || unitsInt < 1) { setError("Units must be a whole number ≥ 1"); return; }
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/admin/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", units_completed: unitsInt, rate_per_unit: Number(rate) }),
    });
    setSubmitting(false);
    if (!res.ok) { setError("Failed to mark complete"); return; }
    setCompleting(false);
    setUnits("");
    setRate("");
    onUpdated();
    onClose();
  }

  async function handleCancelOne() {
    if (!job) return;
    if (!window.confirm("Cancel this occurrence?")) return;
    await fetch(`/api/admin/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    onUpdated();
    onClose();
  }

  async function handleCancelSeries() {
    if (!job) return;
    if (!window.confirm("Cancel ALL jobs in this series? This cannot be undone.")) return;
    await fetch(`/api/admin/jobs/${job.id}?scope=series`, { method: "DELETE" });
    onUpdated();
    onClose();
  }

  const startDate = job ? new Date(job.scheduled_start) : null;
  const endDate = job?.scheduled_end ? new Date(job.scheduled_end) : null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { setCompleting(false); onClose(); } }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {job && (
          <>
            <SheetHeader>
              <div className="flex items-start justify-between gap-3">
                <SheetTitle className="text-navy font-black leading-tight">{job.title}</SheetTitle>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_COLORS[job.status] ?? ""}`}>
                  {job.status}
                </span>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-3 text-sm">
              <Row label="Customer" value={job.customer_name} />
              <Row label="Service" value={job.service_name} />
              {job.location_address && <Row label="Address" value={job.location_address} />}
              <Row
                label="Date"
                value={startDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) ?? "—"}
              />
              <Row
                label="Time"
                value={
                  startDate
                    ? `${startDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}${endDate ? ` – ${endDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}`
                    : "—"
                }
              />
              {job.notes && <Row label="Notes" value={job.notes} />}
              {job.status === "completed" && job.total_revenue !== null && (
                <Row
                  label="Revenue"
                  value={`${job.units_completed} units × $${job.rate_per_unit} = $${job.total_revenue}`}
                />
              )}
            </div>

            {(job.status === "scheduled" || job.status === "pending") && (
              <div className="mt-8 space-y-3">
                {!completing ? (
                  <Button
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => setCompleting(true)}
                  >
                    Mark Complete
                  </Button>
                ) : (
                  <div className="rounded-lg border border-navy/10 p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-navy/40">Log Completion</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="units">Units washed</Label>
                        <Input
                          id="units"
                          type="number"
                          min={1}
                          placeholder="60"
                          value={units}
                          onChange={(e) => setUnits(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="rate">$ per unit</Label>
                        <Input
                          id="rate"
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="42.50"
                          value={rate}
                          onChange={(e) => setRate(e.target.value)}
                        />
                      </div>
                    </div>
                    {total && (
                      <p className="text-sm font-semibold text-navy">
                        Total: <span className="text-emerald-700">${total}</span>
                      </p>
                    )}
                    {error && <p className="text-xs text-brand-red">{error}</p>}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={submitting}
                        onClick={handleComplete}
                      >
                        {submitting ? "Saving…" : "Confirm"}
                      </Button>
                      <Button variant="outline" onClick={() => setCompleting(false)}>Back</Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-brand-red/30 text-brand-red hover:bg-red-50"
                    onClick={handleCancelOne}
                  >
                    Cancel This Week
                  </Button>
                  {isSeries && (
                    <Button
                      variant="outline"
                      className="flex-1 border-brand-red/50 text-brand-red hover:bg-red-50"
                      onClick={handleCancelSeries}
                    >
                      Cancel Entire Series
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-20 shrink-0 text-[11px] font-bold uppercase tracking-wide text-navy/35">{label}</span>
      <span className="text-navy/80">{value}</span>
    </div>
  );
}
