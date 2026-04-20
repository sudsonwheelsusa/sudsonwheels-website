"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import { SERVICE_ICON_OPTIONS, ServiceIcon } from "@/lib/service-icons";
import type { ServiceRecord } from "@/lib/types";

export default function ServicesSection() {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    icon: "House",
    sort_order: "7",
  });

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("services")
      .select("id, name, description, icon, sort_order, is_active, created_at")
      .order("sort_order", { ascending: true });
    if (err) setError(err.message);
    else setServices((data ?? []) as ServiceRecord[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

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
    setBusyKey(`delete:${serviceId}`);
    const supabase = createClient();
    const { error: err } = await supabase.from("services").delete().eq("id", serviceId);
    setBusyKey(null);
    if (err) { setError(err.message); return; }
    await load();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-black text-navy">Services</h2>
        <p className="text-sm text-slate-500 mt-1">Add, pause, or remove public service offerings.</p>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-brand-red">
          {error}
        </p>
      )}

      <form onSubmit={handleAdd} className="grid gap-3 rounded-2xl bg-slate-50 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
            placeholder="Service name"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            required
          />
          <select
            value={form.icon}
            onChange={(e) => setForm((c) => ({ ...c, icon: e.target.value }))}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            {SERVICE_ICON_OPTIONS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <textarea
          value={form.description}
          onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
          placeholder="Service description"
          rows={3}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          required
        />
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            value={form.sort_order}
            onChange={(e) => setForm((c) => ({ ...c, sort_order: e.target.value }))}
            className="w-28 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          <Button type="submit" className="bg-navy text-white hover:bg-navy/90" disabled={busyKey === "add"}>
            {busyKey === "add" ? "Saving..." : "Add service"}
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {loading && <p className="text-sm text-slate-400">Loading...</p>}
        {services.map((service) => (
          <div
            key={service.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 shrink-0">
                <ServiceIcon name={service.icon} className="size-5 text-navy" />
              </div>
              <div>
                <p className="font-semibold text-navy">{service.name}</p>
                <p className="text-sm text-slate-500">{service.description}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => toggle(service)}
                disabled={busyKey === `toggle:${service.id}`}
              >
                {service.is_active ? "Hide" : "Show"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => remove(service.id)}
                disabled={busyKey === `delete:${service.id}`}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
