"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import MfaVerifyStep from "./MfaVerifyStep";

type Step = "credentials" | "mfa";

export default function AdminLoginForm() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("credentials");
  const [factorId, setFactorId] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!turnstileToken) {
      setStatus("error");
      setMessage("Please complete the bot verification.");
      return;
    }

    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const isRateLimited =
        error.status === 429 ||
        error.message.toLowerCase().includes("rate limit") ||
        error.message.toLowerCase().includes("too many");
      setStatus("error");
      setMessage(
        isRateLimited
          ? "Too many attempts. Try again later."
          : "Invalid credentials."
      );
      turnstileRef.current?.reset();
      setTurnstileToken("");
      return;
    }

    // Check if this account has MFA enrolled
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totpFactor = (factors?.totp ?? []).find((f) => f.status === "verified");

    if (!totpFactor) {
      router.push("/portal/dashboard");
      router.refresh();
      return;
    }

    // MFA enrolled — show step 2
    setFactorId(totpFactor.id);
    setStatus("idle");
    setStep("mfa");
  }

  function handleMfaSuccess() {
    router.push("/portal/dashboard");
    router.refresh();
  }

  function handleMfaBack() {
    const supabase = createClient();
    void supabase.auth.signOut();
    setStep("credentials");
    setStatus("idle");
    setFactorId("");
    setPassword("");
    turnstileRef.current?.reset();
    setTurnstileToken("");
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-red mb-1">
          Admin Portal
        </p>
        <p className="text-xl font-black tracking-tight text-navy">
          Suds<span className="text-brand-red">On</span>Wheels
        </p>
      </div>

      <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
        {step === "mfa" ? (
          <MfaVerifyStep
            factorId={factorId}
            onSuccess={handleMfaSuccess}
            onBack={handleMfaBack}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-1.5 mb-2">
              <div className="h-1 w-6 rounded-full bg-navy" />
              <div className="h-1 w-6 rounded-full bg-navy/15" />
            </div>

            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-navy/50"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-navy/15 bg-offwhite px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-brand-red/25 focus:border-brand-red/40"
                placeholder="owner@example.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-navy/50"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-navy/15 bg-offwhite px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-brand-red/25 focus:border-brand-red/40"
                required
              />
            </div>

            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => { setTurnstileError(false); setTurnstileToken(token); }}
              onError={() => { setTurnstileError(true); setTurnstileToken(""); }}
              onExpire={() => { setTurnstileError(false); setTurnstileToken(""); }}
            />
            {turnstileError ? (
              <p className="text-xs text-brand-red">
                Bot verification failed to load. Try disabling tracking protection or use a different browser.
              </p>
            ) : null}

            {status === "error" ? (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-brand-red">
                {message}
              </p>
            ) : null}

            <Button
              type="submit"
              className="h-11 w-full bg-navy text-white hover:bg-navy/90"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
