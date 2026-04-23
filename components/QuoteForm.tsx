"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import LocationPicker from "@/components/LocationPicker";
import type { LatLng } from "@/components/LocationPickerMap";
import { leadSchema, type LeadInput } from "@/lib/schemas/lead";

interface QuoteFormProps {
  serviceOptions: Array<{
    id: string;
    name: string;
  }>;
}

export default function QuoteForm({ serviceOptions }: QuoteFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [turnstileError, setTurnstileError] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(
    null
  );
  const turnstileRef = useRef<TurnstileInstance>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      website: "",
    },
  });

  async function onSubmit(data: LeadInput) {
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }

      setStatus("success");
      setSelectedLocation(null);
      reset({ website: "" });
      turnstileRef.current?.reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      turnstileRef.current?.reset();
    }
  }

  function handleLocationChange(value: LatLng | null) {
    setSelectedLocation(value);
    setValue("location_lat", value?.lat, { shouldValidate: true });
    setValue("location_lng", value?.lng, { shouldValidate: true });
  }

  if (status === "success") {
    return (
      <div className="flex h-full flex-col items-center justify-center py-12 text-center">
        <span className="mb-4 text-4xl">✓</span>
        <h3 className="mb-2 text-lg font-bold text-navy">Quote request sent!</h3>
        <p className="text-sm text-gray-500">
          We&apos;ll get back to you within one business day.
        </p>
      </div>
    );
  }

  return (
    // eslint-disable-next-line react-hooks/refs
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <h3 className="mb-1 text-lg font-black text-navy">Request a Free Quote</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            First Name
          </label>
          <input
            {...register("first_name")}
            placeholder="Jane"
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
          {errors.first_name ? (
            <p className="mt-1 text-xs text-brand-red">{errors.first_name.message}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            Last Name
          </label>
          <input
            {...register("last_name")}
            placeholder="Smith"
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
          {errors.last_name ? (
            <p className="mt-1 text-xs text-brand-red">{errors.last_name.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600">
          Email
        </label>
        <input
          {...register("email")}
          type="email"
          placeholder="jane@email.com"
          className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        />
        {errors.email ? (
          <p className="mt-1 text-xs text-brand-red">{errors.email.message}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600">
          Service Needed
        </label>
        <select
          {...register("service_id")}
          className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        >
          <option value="">Select a service...</option>
          {serviceOptions.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
        {errors.service_id ? (
          <p className="mt-1 text-xs text-brand-red">{errors.service_id.message}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600">
          Service Address
        </label>
        <input
          {...register("location_address")}
          placeholder="123 Main St, Ashland, OH"
          className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        />
        {errors.location_address ? (
          <p className="mt-1 text-xs text-brand-red">
            {errors.location_address.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="block text-xs font-semibold text-gray-600">
            Click your location on the map
          </label>
          <span className="text-[11px] text-gray-400">
            Optional, but helpful for faster estimates
          </span>
        </div>
        <LocationPicker value={selectedLocation} onChange={handleLocationChange} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600">
          Anything else? (optional)
        </label>
        <textarea
          {...register("message")}
          rows={3}
          placeholder="Gate code, job size, preferred timing, or anything else we should know."
          className="w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        />
      </div>

      <Turnstile
        ref={turnstileRef}
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={(token) => { setTurnstileError(false); setValue("turnstile_token", token, { shouldValidate: true }); }}
        onError={() => { setTurnstileError(true); setValue("turnstile_token", "", { shouldValidate: true }); }}
        onExpire={() => { setTurnstileError(false); setValue("turnstile_token", "", { shouldValidate: true }); }}
      />
      {turnstileError ? (
        <p className="text-xs text-brand-red">
          Bot verification failed to load. Try disabling tracking protection or use a different browser.
        </p>
      ) : errors.turnstile_token ? (
        <p className="text-xs text-brand-red">{errors.turnstile_token.message}</p>
      ) : null}

      {status === "error" ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-brand-red">
          {errorMsg}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-md bg-brand-red py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Sending..." : "Send Quote Request"}
      </button>
    </form>
  );
}
