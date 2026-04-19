"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { leadSchema, type LeadInput } from "@/lib/schemas/lead";

const SERVICES = [
  "House & Siding",
  "Driveways & Concrete",
  "Decks & Fences",
  "Gutters",
  "Fleet Washing",
  "Roof Soft Wash",
  "Not sure — need a recommendation",
];

export default function QuoteForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
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
      reset();
      turnstileRef.current?.reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      turnstileRef.current?.reset();
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <span className="text-4xl mb-4">✅</span>
        <h3 className="text-navy font-bold text-lg mb-2">Quote request sent!</h3>
        <p className="text-gray-500 text-sm">
          We&apos;ll get back to you within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <h3 className="text-navy font-black text-lg mb-1">Request a Free Quote</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            First Name
          </label>
          <input
            {...register("first_name")}
            placeholder="Jane"
            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
          {errors.first_name && (
            <p className="text-brand-red text-xs mt-1">{errors.first_name.message}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Last Name
          </label>
          <input
            {...register("last_name")}
            placeholder="Smith"
            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
          {errors.last_name && (
            <p className="text-brand-red text-xs mt-1">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
          <input
            {...register("phone")}
            type="tel"
            placeholder="(419) 555-0000"
            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
          {errors.phone && (
            <p className="text-brand-red text-xs mt-1">{errors.phone.message}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
          <input
            {...register("email")}
            type="email"
            placeholder="jane@email.com"
            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
          {errors.email && (
            <p className="text-brand-red text-xs mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Service Needed
        </label>
        <select
          {...register("service")}
          className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy/30"
        >
          <option value="">Select a service...</option>
          {SERVICES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {errors.service && (
          <p className="text-brand-red text-xs mt-1">{errors.service.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Anything else? (optional)
        </label>
        <textarea
          {...register("message")}
          rows={3}
          placeholder="Address, job size, timing, etc."
          className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy/30 resize-none"
        />
      </div>

      <Turnstile
        ref={turnstileRef}
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={(token) => setValue("turnstile_token", token)}
        onError={() => setValue("turnstile_token", "")}
        onExpire={() => setValue("turnstile_token", "")}
      />
      {errors.turnstile_token && (
        <p className="text-brand-red text-xs">{errors.turnstile_token.message}</p>
      )}

      {status === "error" && (
        <p className="text-brand-red text-sm bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-brand-red text-white font-bold text-sm py-3 rounded-md hover:bg-brand-red/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Sending..." : "Send Quote Request"}
      </button>
    </form>
  );
}
