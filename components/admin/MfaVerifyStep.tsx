"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

type Props = {
  factorId: string;
  onSuccess: () => void;
  onBack: () => void;
};

export default function MfaVerifyStep({ factorId, onSuccess, onBack }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const supabase = createClient();
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });

    setBusy(false);

    if (err) {
      setError("Incorrect code. Try again.");
      setCode("");
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <div className="flex gap-1.5 mb-2">
        <div className="h-1 w-6 rounded-full bg-brand-red" />
        <div className="h-1 w-6 rounded-full bg-navy" />
      </div>

      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-red mb-1">
          Step 2 of 2
        </p>
        <label
          htmlFor="mfa-code"
          className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-navy/50"
        >
          Authenticator Code
        </label>
        <input
          id="mfa-code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="w-full rounded-md border border-navy/15 bg-offwhite px-3 py-3 text-center text-2xl font-black tracking-[0.35em] text-navy focus:outline-none focus:ring-2 focus:ring-brand-red/25 focus:border-brand-red/40"
          placeholder="000000"
          autoFocus
          required
        />
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-brand-red">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="h-11 w-full bg-navy text-white hover:bg-navy/90"
        disabled={busy || code.length !== 6}
      >
        {busy ? "Verifying..." : "Verify"}
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-xs text-navy/40 hover:text-navy/60 transition-colors"
      >
        ← Back to sign in
      </button>

      <p className="text-[10px] text-navy/35 text-center">
        Open Google Authenticator or Authy to get your code
      </p>
    </form>
  );
}
