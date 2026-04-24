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
      className={`rounded-lg border p-4 transition-opacity ${
        isDone
          ? "border-navy/8 bg-white opacity-50"
          : "border-navy/10 bg-white shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold text-navy text-sm">
            {lead.first_name} {lead.last_name}
          </p>
          <p className="text-xs text-navy/45 mt-0.5">{lead.service_name}</p>
          {lead.location_address && (
            <p className="text-[10px] text-navy/35 mt-0.5 truncate">
              {lead.location_address}
            </p>
          )}
          <p className="text-[10px] text-navy/35 mt-0.5">
            {new Date(lead.created_at).toLocaleDateString()}
          </p>
          {lead.quoted_amount != null && (
            <p className="text-xs font-bold text-navy mt-1">
              {formatCurrency(lead.quoted_amount)}
            </p>
          )}
        </div>
        {lead.scheduled_job_id && !isDone && (
          <span className="shrink-0 rounded bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-emerald-800">
            On cal
          </span>
        )}
      </div>

      {lead.message && (
        <p className="mt-2 rounded-md bg-offwhite px-3 py-2 text-xs text-navy/55 line-clamp-2">
          {lead.message}
        </p>
      )}

      {error && <p className="mt-2 text-xs text-brand-red">{error}</p>}

      {inlineForm === "quote" && (
        <div className="mt-3 space-y-2">
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Quote amount ($)"
            className="w-full rounded-md border border-navy/15 px-3 py-2 text-sm"
            autoFocus
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for customer (optional)"
            className="w-full rounded-md border border-navy/15 px-3 py-2 text-sm"
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

      {inlineForm === "schedule" && (
        <div className="mt-3 space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Job title"
            className="w-full rounded-md border border-navy/15 px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={scheduledStart}
            onChange={(e) => setScheduledStart(e.target.value)}
            className="w-full rounded-md border border-navy/15 px-3 py-2 text-sm"
            autoFocus
          />
          <input
            type="datetime-local"
            value={scheduledEnd}
            onChange={(e) => setScheduledEnd(e.target.value)}
            className="w-full rounded-md border border-navy/15 px-3 py-2 text-sm"
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
                    Add to Calendar
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
