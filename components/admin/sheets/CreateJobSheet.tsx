"use client";

import { useState, useEffect } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/browser";
import type { ServiceRecord } from "@/lib/types";

const DAYS = ["sun","mon","tue","wed","thu","fri","sat"] as const;
const DAY_LABELS: Record<string, string> = {
  sun:"Su", mon:"Mo", tue:"Tu", wed:"We", thu:"Th", fri:"Fr", sat:"Sa"
};

const FormSchema = z.object({
  title: z.string().min(1, "Required"),
  customer_name: z.string().min(1, "Required"),
  service_name: z.string().min(1, "Required"),
  location_address: z.string().optional(),
  date: z.string().min(1, "Required"),
  start_time: z.string().min(1, "Required"),
  end_time: z.string().optional(),
  notes: z.string().optional(),
  recurrence_freq: z.enum(["none","daily","weekly","monthly"]),
  recurrence_interval: z.coerce.number().int().min(1).max(52).optional(),
  recurrence_days: z.array(z.string()).optional(),
  recurrence_end_date: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function CreateJobSheet({ open, onOpenChange, onCreated }: Props) {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(FormSchema) as Resolver<FormValues>,
    defaultValues: {
      recurrence_freq: "none",
      recurrence_interval: 1,
      recurrence_days: [],
    },
  });

  const freq = watch("recurrence_freq");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("services").select("id,name,sort_order").eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setServices((data ?? []) as ServiceRecord[]));
  }, []);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);

    const startISO = new Date(`${values.date}T${values.start_time}`).toISOString();
    const endISO = values.end_time
      ? new Date(`${values.date}T${values.end_time}`).toISOString()
      : undefined;

    const body: Record<string, unknown> = {
      title: values.title,
      customer_name: values.customer_name,
      service_name: values.service_name,
      location_address: values.location_address || undefined,
      notes: values.notes || undefined,
      scheduled_start: startISO,
      scheduled_end: endISO,
    };

    if (values.recurrence_freq !== "none") {
      body.recurrence = {
        freq: values.recurrence_freq,
        interval: values.recurrence_interval ?? 1,
        ...(values.recurrence_freq === "weekly" && values.recurrence_days?.length
          ? { days: values.recurrence_days }
          : {}),
        ...(values.recurrence_end_date ? { end_date: values.recurrence_end_date } : {}),
      };
    }

    const res = await fetch("/api/admin/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSubmitting(false);

    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: "Unknown error" }));
      setError(msg ?? "Failed to create job");
      return;
    }

    reset();
    onOpenChange(false);
    onCreated();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-navy font-black">New Job</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Job Title</Label>
            <Input id="title" placeholder="Valley Transportation — Fleet Wash" {...register("title")} />
            {errors.title && <p className="text-xs text-brand-red">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer_name">Customer Name</Label>
            <Input id="customer_name" placeholder="Valley Transportation" {...register("customer_name")} />
            {errors.customer_name && <p className="text-xs text-brand-red">{errors.customer_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="service_name">Service</Label>
            <Controller
              name="service_name"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.service_name && <p className="text-xs text-brand-red">{errors.service_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location_address">Address (optional)</Label>
            <Input id="location_address" placeholder="123 Main St, Ashland, OH" {...register("location_address")} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-1">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-brand-red">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5 col-span-1">
              <Label htmlFor="start_time">Start</Label>
              <Input id="start_time" type="time" {...register("start_time")} />
            </div>
            <div className="space-y-1.5 col-span-1">
              <Label htmlFor="end_time">End</Label>
              <Input id="end_time" type="time" {...register("end_time")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" rows={2} {...register("notes")} />
          </div>

          <div className="rounded-lg border border-navy/10 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-navy/40">Recurrence</p>

            <div className="space-y-1.5">
              <Label>Repeat</Label>
              <Controller
                name="recurrence_freq"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Does not repeat</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {freq !== "none" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="recurrence_interval">
                    Every{" "}
                    <span className="text-navy/50">
                      {freq === "daily" ? "day(s)" : freq === "weekly" ? "week(s)" : "month(s)"}
                    </span>
                  </Label>
                  <Input
                    id="recurrence_interval"
                    type="number"
                    min={1}
                    max={52}
                    className="w-24"
                    {...register("recurrence_interval")}
                  />
                </div>

                {freq === "weekly" && (
                  <div className="space-y-1.5">
                    <Label>On days</Label>
                    <Controller
                      name="recurrence_days"
                      control={control}
                      render={({ field }) => (
                        <div className="flex gap-1.5 flex-wrap">
                          {DAYS.map((day) => {
                            const selected = field.value?.includes(day) ?? false;
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  const next = selected
                                    ? (field.value ?? []).filter((d) => d !== day)
                                    : [...(field.value ?? []), day];
                                  field.onChange(next);
                                }}
                                className={`h-8 w-8 rounded-full text-[11px] font-bold transition-colors ${
                                  selected
                                    ? "bg-navy text-white"
                                    : "bg-navy/8 text-navy/50 hover:bg-navy/15"
                                }`}
                              >
                                {DAY_LABELS[day]}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="recurrence_end_date">Ends on (optional — default: 6 months)</Label>
                  <Input id="recurrence_end_date" type="date" {...register("recurrence_end_date")} />
                </div>
              </>
            )}
          </div>

          {error && (
            <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-brand-red">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting} className="flex-1 bg-navy text-white hover:bg-navy/90">
              {submitting ? "Creating…" : "Create Job"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
