"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/browser";
import { SERVICE_ICON_OPTIONS } from "@/lib/service-icons";
import type { ServiceRecord } from "@/lib/types";

export default function ServicesSection() {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    icon: "House",
    sort_order: "7",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    icon: "House",
    sort_order: "0",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("services")
      .select("id, name, description, icon, sort_order, is_active, created_at")
      .order("sort_order", { ascending: true });
    if (err) setError(err.message);
    else setServices((data ?? []) as ServiceRecord[]);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

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
    setShowAdd(false);
    await load();
  }

  async function handleSaveEdit(serviceId: string) {
    setBusyKey(`edit:${serviceId}`);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase
      .from("services")
      .update({
        name: editForm.name,
        description: editForm.description,
        icon: editForm.icon,
        sort_order: Number(editForm.sort_order) || 0,
      })
      .eq("id", serviceId);
    setBusyKey(null);
    if (err) { setError(err.message); return; }
    setEditingId(null);
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
    if (!window.confirm("Delete this service?")) return;
    setBusyKey(`delete:${serviceId}`);
    const supabase = createClient();
    const { error: err } = await supabase.from("services").delete().eq("id", serviceId);
    setBusyKey(null);
    if (err) { setError(err.message); return; }
    await load();
  }

  function startEdit(service: ServiceRecord) {
    setEditingId(service.id);
    setEditForm({
      name: service.name,
      description: service.description,
      icon: service.icon ?? "House",
      sort_order: String(service.sort_order),
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-red mb-1">
            Admin Dashboard
          </p>
          <h2 className="text-2xl font-black text-navy tracking-tight">Services</h2>
          {!loading && (
            <p className="text-sm text-navy/45 mt-1">{services.length} services</p>
          )}
        </div>
        <Button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-full bg-navy text-white hover:bg-navy/90 gap-1.5"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Service
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-brand-red">
          {error}
        </p>
      )}

      {/* Add form (collapsible) */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="grid gap-3 rounded-lg bg-white border border-navy/10 p-4 shadow-sm"
        >
          <p className="text-xs font-bold text-navy mb-1">New Service</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              placeholder="Service name"
              className="rounded-lg border border-navy/15 bg-offwhite px-3 py-2.5 text-sm"
              required
            />
            <select
              value={form.icon}
              onChange={(e) => setForm((c) => ({ ...c, icon: e.target.value }))}
              aria-label="Service icon"
              className="rounded-lg border border-navy/15 bg-offwhite px-3 py-2.5 text-sm"
            >
              {SERVICE_ICON_OPTIONS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <textarea
            value={form.description}
            onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
            placeholder="Short description"
            rows={2}
            className="rounded-lg border border-navy/15 bg-offwhite px-3 py-2.5 text-sm"
            required
          />
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => setForm((c) => ({ ...c, sort_order: e.target.value }))}
              placeholder="Sort order"
              className="w-24 rounded-lg border border-navy/15 bg-offwhite px-3 py-2.5 text-sm"
            />
            <Button type="submit" className="bg-navy text-white hover:bg-navy/90" disabled={busyKey === "add"}>
              {busyKey === "add" ? "Saving..." : "Save"}
            </Button>
            <button type="button" onClick={() => setShowAdd(false)} className="text-sm text-navy/40 hover:text-navy/60">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Service list */}
      <div className="bg-white rounded-2xl border border-navy/8 shadow-sm overflow-hidden">
        {loading ? (
          <p className="px-5 py-6 text-sm text-navy/30">Loading...</p>
        ) : services.length === 0 ? (
          <p className="px-5 py-6 text-sm text-navy/30">No services yet. Add one above.</p>
        ) : (
          services.map((service, i) => (
            <div key={service.id}>
              {editingId === service.id ? (
                <div className="px-5 py-4 bg-offwhite">
                  <div className="grid gap-3 sm:grid-cols-2 mb-3">
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm((c) => ({ ...c, name: e.target.value }))}
                      aria-label="Service name"
                      placeholder="Service name"
                      className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm"
                    />
                    <select
                      value={editForm.icon}
                      onChange={(e) => setEditForm((c) => ({ ...c, icon: e.target.value }))}
                      aria-label="Service icon"
                      className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm"
                    >
                      {SERVICE_ICON_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((c) => ({ ...c, description: e.target.value }))}
                    aria-label="Service description"
                    placeholder="Short description"
                    rows={2}
                    className="w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm mb-3"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-navy text-white hover:bg-navy/90"
                      onClick={() => handleSaveEdit(service.id)}
                      disabled={busyKey === `edit:${service.id}`}
                    >
                      {busyKey === `edit:${service.id}` ? "Saving..." : "Save"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-sm text-navy/40 hover:text-navy/60 px-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`flex items-center gap-4 px-5 py-4 ${
                    i < services.length - 1 ? "border-b border-navy/5" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-navy">{service.name}</p>
                      {service.sort_order != null && (
                        <span className="rounded-full bg-navy/6 border border-navy/10 px-2 py-0.5 text-[10px] font-semibold text-navy/60">
                          #{service.sort_order}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-navy/50 mt-0.5">{service.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={() => toggle(service)}
                      disabled={busyKey === `toggle:${service.id}`}
                      aria-label={service.is_active ? "Active" : "Inactive"}
                    />
                    <button
                      type="button"
                      onClick={() => startEdit(service)}
                      className="text-navy/40 hover:text-navy transition-colors p-1"
                      aria-label="Edit"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(service.id)}
                      disabled={busyKey === `delete:${service.id}`}
                      className="text-brand-red/50 hover:text-brand-red transition-colors p-1"
                      aria-label="Delete"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
