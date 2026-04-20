"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import type { GalleryRecord } from "@/lib/types";

export default function GallerySection() {
  const [items, setItems] = useState<GalleryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    location: "",
    detail: "",
    before_label: "Before wash",
    after_label: "After wash",
    sort_order: "1",
    before_file: null as File | null,
    after_file: null as File | null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("gallery_items")
      .select("id, title, location, detail, before_image_path, after_image_path, before_label, after_label, sort_order, is_active, created_at")
      .order("sort_order", { ascending: true });
    if (err) { setError(err.message); setLoading(false); return; }

    const withUrls = (data ?? []).map((item) => ({
      ...item,
      before_image_url: item.before_image_path
        ? supabase.storage.from("gallery").getPublicUrl(item.before_image_path).data.publicUrl
        : null,
      after_image_url: item.after_image_path
        ? supabase.storage.from("gallery").getPublicUrl(item.after_image_path).data.publicUrl
        : null,
    })) as GalleryRecord[];

    setItems(withUrls);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function uploadFile(file: File, folder: "before" | "after") {
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error: err } = await supabase.storage.from("gallery").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (err) throw err;
    return path;
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.before_file || !form.after_file) {
      setError("Both before and after photos are required.");
      return;
    }
    setBusyKey("add");
    setError("");
    const supabase = createClient();
    try {
      const [beforePath, afterPath] = await Promise.all([
        uploadFile(form.before_file, "before"),
        uploadFile(form.after_file, "after"),
      ]);
      const { error: err } = await supabase.from("gallery_items").insert({
        title: form.title,
        location: form.location,
        detail: form.detail,
        before_image_path: beforePath,
        after_image_path: afterPath,
        before_label: form.before_label,
        after_label: form.after_label,
        sort_order: Number(form.sort_order) || 0,
      });
      if (err) throw err;
      setForm({ title: "", location: "", detail: "", before_label: "Before wash", after_label: "After wash", sort_order: String(items.length + 1), before_file: null, after_file: null });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload photos.");
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleItem(item: GalleryRecord) {
    setBusyKey(`toggle:${item.id}`);
    const supabase = createClient();
    const { error: err } = await supabase.from("gallery_items").update({ is_active: !item.is_active }).eq("id", item.id);
    setBusyKey(null);
    if (err) { setError(err.message); return; }
    await load();
  }

  async function removeItem(item: GalleryRecord) {
    setBusyKey(`delete:${item.id}`);
    const supabase = createClient();
    const paths = [item.before_image_path, item.after_image_path].filter(Boolean) as string[];
    if (paths.length) {
      const { error: storErr } = await supabase.storage.from("gallery").remove(paths);
      if (storErr) { setBusyKey(null); setError(storErr.message); return; }
    }
    const { error: err } = await supabase.from("gallery_items").delete().eq("id", item.id);
    setBusyKey(null);
    if (err) { setError(err.message); return; }
    await load();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-black text-navy">Gallery</h2>
        <p className="text-sm text-slate-500 mt-1">Upload before-and-after jobs directly into the public gallery.</p>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-brand-red">
          {error}
        </p>
      )}

      <form onSubmit={handleAdd} className="grid gap-3 rounded-2xl bg-slate-50 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} placeholder="Title" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" required />
          <input value={form.location} onChange={(e) => setForm((c) => ({ ...c, location: e.target.value }))} placeholder="Location" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" required />
        </div>
        <input value={form.detail} onChange={(e) => setForm((c) => ({ ...c, detail: e.target.value }))} placeholder="Detail" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" required />
        <div className="grid gap-3 sm:grid-cols-2">
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setForm((c) => ({ ...c, before_file: e.target.files?.[0] ?? null }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required />
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setForm((c) => ({ ...c, after_file: e.target.files?.[0] ?? null }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
          <input value={form.before_label} onChange={(e) => setForm((c) => ({ ...c, before_label: e.target.value }))} placeholder="Before label" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <input value={form.after_label} onChange={(e) => setForm((c) => ({ ...c, after_label: e.target.value }))} placeholder="After label" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <input type="number" min={0} value={form.sort_order} onChange={(e) => setForm((c) => ({ ...c, sort_order: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        </div>
        <Button type="submit" className="w-fit bg-navy text-white hover:bg-navy/90" disabled={busyKey === "add"}>
          {busyKey === "add" ? "Uploading..." : "Add gallery item"}
        </Button>
      </form>

      <div className="space-y-3">
        {loading && <p className="text-sm text-slate-400">Loading...</p>}
        {items.map((item) => (
          <div key={item.id} className="grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[180px_1fr_auto]">
            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200">
              {item.before_image_url ? (
                <img src={item.before_image_url} alt={`${item.title} before`} className="h-24 w-full object-cover" />
              ) : (
                <div className="flex h-24 items-center justify-center bg-slate-100 text-xs text-slate-500">No before</div>
              )}
              {item.after_image_url ? (
                <img src={item.after_image_url} alt={`${item.title} after`} className="h-24 w-full object-cover" />
              ) : (
                <div className="flex h-24 items-center justify-center bg-slate-100 text-xs text-slate-500">No after</div>
              )}
            </div>
            <div>
              <p className="font-semibold text-navy">{item.title}</p>
              <p className="text-sm text-slate-500">{item.location} · {item.detail}</p>
            </div>
            <div className="flex gap-2 items-start">
              <Button type="button" variant="outline" size="sm" onClick={() => toggleItem(item)} disabled={busyKey === `toggle:${item.id}`}>
                {item.is_active ? "Hide" : "Show"}
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(item)} disabled={busyKey === `delete:${item.id}`}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
