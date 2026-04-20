"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";

export default function AdminLoginForm() {
  const router = useRouter();
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
      setStatus("error");
      setMessage(error.message);
      turnstileRef.current?.reset();
      setTurnstileToken("");
      return;
    }

    router.push("/portal/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
          placeholder="owner@example.com"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
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
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-brand-red">
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
  );
}
