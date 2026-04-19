"use client";

import type { FormEvent } from "react";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import { SERVICE_ICON_OPTIONS, ServiceIcon } from "@/lib/service-icons";
import type { GalleryRecord, JobRecord, LeadRecord, ServiceRecord } from "@/lib/types";

type WorkflowDraft = {
  internal_notes?: string;
  estimate_notes?: string;
  quoted_amount?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  title?: string;
};

function formatCurrency(amount: number | null) {
  if (amount == null) {
    return "Not quoted";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function getMapLink(lead: LeadRecord) {
  if (lead.location_lat != null && lead.location_lng != null) {
    return `https://www.google.com/maps?q=${lead.location_lat},${lead.location_lng}`;
  }

  if (lead.location_address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      lead.location_address
    )}`;
  }

  return null;
}

function getMonthGrid(month: Date) {
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

export default function AdminDashboard({
  initialAdminEmail,
}: {
  initialAdminEmail: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryRecord[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    icon: "House",
    sort_order: "7",
  });
  const [galleryForm, setGalleryForm] = useState({
    title: "",
    location: "",
    detail: "",
    before_label: "Before wash",
    after_label: "After wash",
    sort_order: "1",
    before_file: null as File | null,
    after_file: null as File | null,
  });
  const [workflowDrafts, setWorkflowDrafts] = useState<Record<string, WorkflowDraft>>({});

  async function loadDashboard() {
    setLoading(true);
    setError("");
    const supabase = createClient();

    const [servicesResult, galleryResult, leadsResult, jobsResult] = await Promise.all([
      supabase
        .from("services")
        .select("id, name, description, icon, sort_order, is_active, created_at")
        .order("sort_order", { ascending: true }),
      supabase
        .from("gallery_items")
        .select(
          "id, title, location, detail, before_image_path, after_image_path, before_label, after_label, sort_order, is_active, created_at"
        )
        .order("sort_order", { ascending: true }),
      supabase
        .from("leads")
        .select(
          "id, first_name, last_name, phone, email, service_id, service_name, location_address, location_lat, location_lng, message, status, internal_notes, quoted_amount, estimate_sent_at, approved_at, rejected_at, scheduled_job_id, created_at"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("jobs")
        .select(
          "id, lead_id, estimate_id, title, status, scheduled_start, scheduled_end, service_name, customer_name, location_address, location_lat, location_lng, notes, created_by, created_at"
        )
        .order("scheduled_start", { ascending: true }),
    ]);

    const firstError =
      servicesResult.error ??
      galleryResult.error ??
      leadsResult.error ??
      jobsResult.error;

    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    const galleryWithUrls = (galleryResult.data ?? []).map((item) => ({
      ...item,
      before_image_url: item.before_image_path
        ? supabase.storage.from("gallery").getPublicUrl(item.before_image_path)
            .data.publicUrl
        : null,
      after_image_url: item.after_image_path
        ? supabase.storage.from("gallery").getPublicUrl(item.after_image_path)
            .data.publicUrl
        : null,
    })) satisfies GalleryRecord[];

    startTransition(() => {
      setServices((servicesResult.data ?? []) as ServiceRecord[]);
      setGalleryItems(galleryWithUrls);
      setLeads((leadsResult.data ?? []) as LeadRecord[]);
      setJobs((jobsResult.data ?? []) as JobRecord[]);
    });
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  function getDraft(lead: LeadRecord, source = workflowDrafts) {
    const existing = source[lead.id];

    return {
      internal_notes: existing?.internal_notes ?? lead.internal_notes ?? "",
      estimate_notes: existing?.estimate_notes ?? "",
      quoted_amount:
        existing?.quoted_amount ?? (lead.quoted_amount?.toString() ?? ""),
      scheduled_start: existing?.scheduled_start ?? "",
      scheduled_end: existing?.scheduled_end ?? "",
      title:
        existing?.title ??
        `${lead.service_name} - ${lead.first_name} ${lead.last_name}`,
    };
  }

  function updateDraft(
    lead: LeadRecord,
    field: keyof WorkflowDraft,
    value: string
  ) {
    setWorkflowDrafts((current) => ({
      ...current,
      [lead.id]: {
        ...getDraft(lead, current),
        [field]: value,
      },
    }));
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/portal");
    router.refresh();
  }

  async function handleAddService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyKey("service:add");
    setError("");
    const supabase = createClient();

    const { error: insertError } = await supabase.from("services").insert({
      name: serviceForm.name,
      description: serviceForm.description,
      icon: serviceForm.icon,
      sort_order: Number(serviceForm.sort_order) || 0,
    });

    setBusyKey(null);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setServiceForm({
      name: "",
      description: "",
      icon: "House",
      sort_order: String(services.length + 1),
    });
    await loadDashboard();
  }

  async function toggleService(service: ServiceRecord) {
    setBusyKey(`service:${service.id}`);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("services")
      .update({ is_active: !service.is_active })
      .eq("id", service.id);
    setBusyKey(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadDashboard();
  }

  async function deleteService(serviceId: string) {
    setBusyKey(`service:delete:${serviceId}`);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId);
    setBusyKey(null);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadDashboard();
  }

  async function uploadGalleryFile(file: File, folder: "before" | "after") {
    const supabase = createClient();
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    return path;
  }

  async function handleAddGalleryItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyKey("gallery:add");
    setError("");
    const supabase = createClient();

    if (!galleryForm.before_file || !galleryForm.after_file) {
      setBusyKey(null);
      setError("Both before and after photos are required.");
      return;
    }

    try {
      const [beforePath, afterPath] = await Promise.all([
        uploadGalleryFile(galleryForm.before_file, "before"),
        uploadGalleryFile(galleryForm.after_file, "after"),
      ]);

      const { error: insertError } = await supabase.from("gallery_items").insert({
        title: galleryForm.title,
        location: galleryForm.location,
        detail: galleryForm.detail,
        before_image_path: beforePath,
        after_image_path: afterPath,
        before_label: galleryForm.before_label,
        after_label: galleryForm.after_label,
        sort_order: Number(galleryForm.sort_order) || 0,
      });

      if (insertError) {
        throw insertError;
      }

      setGalleryForm({
        title: "",
        location: "",
        detail: "",
        before_label: "Before wash",
        after_label: "After wash",
        sort_order: String(galleryItems.length + 1),
        before_file: null,
        after_file: null,
      });
      await loadDashboard();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload gallery photos."
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleGalleryItem(item: GalleryRecord) {
    setBusyKey(`gallery:${item.id}`);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("gallery_items")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);
    setBusyKey(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadDashboard();
  }

  async function deleteGalleryItem(item: GalleryRecord) {
    setBusyKey(`gallery:delete:${item.id}`);
    const supabase = createClient();

    const paths = [item.before_image_path, item.after_image_path].filter(
      Boolean
    ) as string[];

    if (paths.length) {
      const { error: storageError } = await supabase.storage.from("gallery").remove(paths);
      if (storageError) {
        setBusyKey(null);
        setError(storageError.message);
        return;
      }
    }

    const { error: deleteError } = await supabase
      .from("gallery_items")
      .delete()
      .eq("id", item.id);
    setBusyKey(null);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadDashboard();
  }

  async function runWorkflow(lead: LeadRecord, action: "approve" | "reject" | "quote" | "schedule") {
    setBusyKey(`lead:${lead.id}:${action}`);
    setError("");

    const draft = getDraft(lead);
    const payload: Record<string, unknown> = {
      action,
      internal_notes: draft.internal_notes,
      estimate_notes: draft.estimate_notes,
      title: draft.title,
    };

    if (draft.quoted_amount) {
      payload.quoted_amount = Number(draft.quoted_amount);
    }

    if (draft.scheduled_start) {
      payload.scheduled_start = new Date(draft.scheduled_start).toISOString();
    }

    if (draft.scheduled_end) {
      payload.scheduled_end = new Date(draft.scheduled_end).toISOString();
    }

    const response = await fetch(`/api/admin/leads/${lead.id}/workflow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    setBusyKey(null);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not update the lead workflow.");
      return;
    }

    await loadDashboard();
  }

  const visibleLeads = leads.filter((lead) => {
    const term = deferredSearch.trim().toLowerCase();
    if (!term) {
      return true;
    }

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

  const gridDays = getMonthGrid(currentMonth);
  const newLeadCount = leads.filter((lead) => lead.status === "new").length;
  const quotedLeadCount = leads.filter((lead) => lead.status === "quoted").length;
  const scheduledLeadCount = jobs.filter((job) => job.status === "scheduled").length;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 rounded-3xl bg-navy px-6 py-6 text-white shadow-lg md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
            Hidden Admin Portal
          </p>
          <h1 className="mt-2 text-3xl font-black">Operations Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-blue-100/80">
            Signed in as {initialAdminEmail}. Manage services, publish gallery
            results, review every form submission, send quotes, and place approved
            jobs on the internal calendar.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-brand-red">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            New Leads
          </p>
          <p className="mt-3 text-3xl font-black text-navy">{newLeadCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Quotes Sent
          </p>
          <p className="mt-3 text-3xl font-black text-navy">{quotedLeadCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Scheduled Jobs
          </p>
          <p className="mt-3 text-3xl font-black text-navy">{scheduledLeadCount}</p>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1.05fr]">
        <div className="space-y-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-navy">Services</h2>
                <p className="text-sm text-slate-500">
                  Add, pause, or remove public service offerings.
                </p>
              </div>
              {loading ? <span className="text-xs text-slate-400">Loading...</span> : null}
            </div>

            <form onSubmit={handleAddService} className="grid gap-3 rounded-2xl bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
                <input
                  value={serviceForm.name}
                  onChange={(event) =>
                    setServiceForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Service name"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  required
                />
                <select
                  value={serviceForm.icon}
                  onChange={(event) =>
                    setServiceForm((current) => ({ ...current, icon: event.target.value }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  {SERVICE_ICON_OPTIONS.map((iconName) => (
                    <option key={iconName} value={iconName}>
                      {iconName}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={serviceForm.description}
                onChange={(event) =>
                  setServiceForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Service description"
                rows={3}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                required
              />
              <div className="flex items-center gap-3">
                <input
                  value={serviceForm.sort_order}
                  onChange={(event) =>
                    setServiceForm((current) => ({
                      ...current,
                      sort_order: event.target.value,
                    }))
                  }
                  type="number"
                  min={0}
                  className="w-28 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
                <Button
                  type="submit"
                  className="bg-navy text-white hover:bg-navy/90"
                  disabled={busyKey === "service:add"}
                >
                  {busyKey === "service:add" ? "Saving..." : "Add service"}
                </Button>
              </div>
            </form>

            <div className="mt-5 space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-start md:justify-between"
                >
                  <div className="flex gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-100">
                      <ServiceIcon name={service.icon} className="size-5 text-navy" />
                    </div>
                    <div>
                      <p className="font-semibold text-navy">{service.name}</p>
                      <p className="text-sm text-slate-500">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleService(service)}
                      disabled={busyKey === `service:${service.id}`}
                    >
                      {service.is_active ? "Hide" : "Show"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteService(service.id)}
                      disabled={busyKey === `service:delete:${service.id}`}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-black text-navy">Gallery</h2>
              <p className="text-sm text-slate-500">
                Upload before-and-after jobs directly into the public gallery.
              </p>
            </div>

            <form onSubmit={handleAddGalleryItem} className="grid gap-3 rounded-2xl bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={galleryForm.title}
                  onChange={(event) =>
                    setGalleryForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Title"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  required
                />
                <input
                  value={galleryForm.location}
                  onChange={(event) =>
                    setGalleryForm((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                  placeholder="Location"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  required
                />
              </div>
              <input
                value={galleryForm.detail}
                onChange={(event) =>
                  setGalleryForm((current) => ({ ...current, detail: event.target.value }))
                }
                placeholder="Detail"
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                required
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    setGalleryForm((current) => ({
                      ...current,
                      before_file: event.target.files?.[0] ?? null,
                    }))
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                  required
                />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    setGalleryForm((current) => ({
                      ...current,
                      after_file: event.target.files?.[0] ?? null,
                    }))
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                  required
                />
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px]">
                <input
                  value={galleryForm.before_label}
                  onChange={(event) =>
                    setGalleryForm((current) => ({
                      ...current,
                      before_label: event.target.value,
                    }))
                  }
                  placeholder="Before label"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
                <input
                  value={galleryForm.after_label}
                  onChange={(event) =>
                    setGalleryForm((current) => ({
                      ...current,
                      after_label: event.target.value,
                    }))
                  }
                  placeholder="After label"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  value={galleryForm.sort_order}
                  onChange={(event) =>
                    setGalleryForm((current) => ({
                      ...current,
                      sort_order: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>
              <Button
                type="submit"
                className="w-fit bg-navy text-white hover:bg-navy/90"
                disabled={busyKey === "gallery:add"}
              >
                {busyKey === "gallery:add" ? "Uploading..." : "Add gallery item"}
              </Button>
            </form>

            <div className="mt-5 space-y-3">
              {galleryItems.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-2xl border border-slate-200 p-4 md:grid-cols-[180px_1fr_auto]"
                >
                  <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200">
                    {item.before_image_url ? (
                      <img
                        src={item.before_image_url}
                        alt={`${item.title} before`}
                        className="h-24 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-24 items-center justify-center bg-slate-100 text-xs text-slate-500">
                        No before photo
                      </div>
                    )}
                    {item.after_image_url ? (
                      <img
                        src={item.after_image_url}
                        alt={`${item.title} after`}
                        className="h-24 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-24 items-center justify-center bg-slate-100 text-xs text-slate-500">
                        No after photo
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-navy">{item.title}</p>
                    <p className="text-sm text-slate-500">
                      {item.location} · {item.detail}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleGalleryItem(item)}
                      disabled={busyKey === `gallery:${item.id}`}
                    >
                      {item.is_active ? "Hide" : "Show"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteGalleryItem(item)}
                      disabled={busyKey === `gallery:delete:${item.id}`}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-navy">Leads & Quotes</h2>
                <p className="text-sm text-slate-500">
                  Every form submission lands here, with workflow controls for
                  approve, reject, quote, and schedule.
                </p>
              </div>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leads"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm sm:w-64"
              />
            </div>

            <div className="space-y-4">
              {visibleLeads.map((lead) => {
                const draft = getDraft(lead);
                const mapLink = getMapLink(lead);

                return (
                  <div
                    key={lead.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-bold text-navy">
                          {lead.first_name} {lead.last_name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {lead.service_name} · {lead.email} · {lead.phone}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                          {lead.status} · {formatDate(lead.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {mapLink ? (
                          <a
                            href={mapLink}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                          >
                            Open map
                          </a>
                        ) : null}
                        <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                          {formatCurrency(lead.quoted_amount)}
                        </span>
                      </div>
                    </div>

                    {lead.location_address ? (
                      <p className="mt-3 text-sm text-slate-500">
                        Address: {lead.location_address}
                      </p>
                    ) : null}
                    {lead.message ? (
                      <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        {lead.message}
                      </p>
                    ) : null}

                    <div className="mt-4 grid gap-3">
                      <textarea
                        value={draft.internal_notes}
                        onChange={(event) =>
                          updateDraft(lead, "internal_notes", event.target.value)
                        }
                        placeholder="Internal notes"
                        rows={3}
                        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                      />
                      <div className="grid gap-3 md:grid-cols-[160px_1fr]">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={draft.quoted_amount}
                          onChange={(event) =>
                            updateDraft(lead, "quoted_amount", event.target.value)
                          }
                          placeholder="Quote amount"
                          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                        <input
                          value={draft.estimate_notes}
                          onChange={(event) =>
                            updateDraft(lead, "estimate_notes", event.target.value)
                          }
                          placeholder="Estimate or scheduling note"
                          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                      </div>
                      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
                        <input
                          type="datetime-local"
                          value={draft.scheduled_start}
                          onChange={(event) =>
                            updateDraft(lead, "scheduled_start", event.target.value)
                          }
                          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                        <input
                          type="datetime-local"
                          value={draft.scheduled_end}
                          onChange={(event) =>
                            updateDraft(lead, "scheduled_end", event.target.value)
                          }
                          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                      </div>
                      <input
                        value={draft.title}
                        onChange={(event) =>
                          updateDraft(lead, "title", event.target.value)
                        }
                        placeholder="Calendar title"
                        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => runWorkflow(lead, "approve")}
                          disabled={busyKey === `lead:${lead.id}:approve`}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => runWorkflow(lead, "reject")}
                          disabled={busyKey === `lead:${lead.id}:reject`}
                        >
                          Reject
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="bg-brand-red text-white hover:bg-brand-red/90"
                          onClick={() => runWorkflow(lead, "quote")}
                          disabled={busyKey === `lead:${lead.id}:quote`}
                        >
                          Send quote
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="bg-navy text-white hover:bg-navy/90"
                          onClick={() => runWorkflow(lead, "schedule")}
                          disabled={busyKey === `lead:${lead.id}:schedule`}
                        >
                          Schedule job
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!visibleLeads.length ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No leads match this search yet.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-navy">Job Calendar</h2>
                <p className="text-sm text-slate-500">
                  Approved jobs automatically land here once scheduled.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                    )
                  }
                >
                  Prev
                </Button>
                <span className="min-w-32 text-center text-sm font-semibold text-navy">
                  {currentMonth.toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-7 gap-2">
              {gridDays.map((day) => {
                const dayJobs = jobs.filter((job) => {
                  const scheduledDate = new Date(job.scheduled_start);
                  return (
                    scheduledDate.getFullYear() === day.getFullYear() &&
                    scheduledDate.getMonth() === day.getMonth() &&
                    scheduledDate.getDate() === day.getDate()
                  );
                });

                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-32 rounded-2xl border p-3 text-left ${
                      isCurrentMonth
                        ? "border-slate-200 bg-white"
                        : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-500">{day.getDate()}</p>
                    <div className="mt-2 space-y-2">
                      {dayJobs.map((job) => (
                        <div
                          key={job.id}
                          className="rounded-xl bg-slate-100 px-2 py-1.5 text-[11px] text-slate-700"
                        >
                          <p className="font-semibold">{job.customer_name}</p>
                          <p>{new Date(job.scheduled_start).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}</p>
                          <p className="truncate">{job.service_name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
