"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

// ─── Business Info ────────────────────────────────────────────────────────────

interface SiteSettings {
  business_name: string;
  phone: string;
  email: string;
  address: string;
}

function BusinessInfoSection() {
  const [form, setForm] = useState<SiteSettings>({
    business_name: "SudsOnWheels",
    phone: "",
    email: "contact@sudsonwheelsusa.com",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("business_name, phone, email, address")
        .limit(1)
        .maybeSingle();
      if (data) {
        setForm({
          business_name: data.business_name ?? "SudsOnWheels",
          phone: data.phone ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
        });
      }
    }
    void load();
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    const supabase = createClient();
    // Upsert — the table has a single row identified by a fixed id
    const { error: err } = await supabase
      .from("site_settings")
      .upsert({ id: "00000000-0000-0000-0000-000000000001", ...form });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="bg-white rounded-2xl border border-navy/8 shadow-sm p-6">
      <h3 className="text-base font-bold text-navy mb-5">Business Info</h3>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="settings-business-name" className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-1.5">
            Business Name
          </label>
          <input
            id="settings-business-name"
            value={form.business_name}
            onChange={(e) => setForm((c) => ({ ...c, business_name: e.target.value }))}
            className="w-full rounded-xl border border-navy/15 bg-offwhite px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-brand-red/25"
            required
          />
        </div>
        <div>
          <label htmlFor="settings-phone" className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-1.5">
            Phone Number
          </label>
          <input
            id="settings-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
            className="w-full rounded-xl border border-navy/15 bg-offwhite px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-brand-red/25"
            placeholder="(555) 000-0000"
          />
        </div>
        <div>
          <label htmlFor="settings-email" className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-1.5">
            Email
          </label>
          <input
            id="settings-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
            className="w-full rounded-xl border border-navy/15 bg-offwhite px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-brand-red/25"
          />
        </div>
        <div>
          <label htmlFor="settings-address" className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-1.5">
            Address
          </label>
          <input
            id="settings-address"
            value={form.address}
            onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))}
            className="w-full rounded-xl border border-navy/15 bg-offwhite px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-brand-red/25"
            placeholder="123 Main St, Ashland, OH"
          />
        </div>

        {error && (
          <p className="text-sm text-brand-red">{error}</p>
        )}

        <Button
          type="submit"
          className="rounded-full bg-navy text-white hover:bg-navy/90 gap-2"
          disabled={saving}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2M7 12l5 5 5-5M12 3v14" />
          </svg>
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}

// ─── MFA ──────────────────────────────────────────────────────────────────────

type MfaStatus = "checking" | "not_enrolled" | "enrolled";

function MfaSection() {
  const [mfaStatus, setMfaStatus] = useState<MfaStatus>("checking");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function checkMfa() {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = (data?.totp ?? []).some((f) => f.status === "verified");
      setMfaStatus(verified ? "enrolled" : "not_enrolled");
    }
    void checkMfa();
  }, []);

  async function startEnrollment() {
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setBusy(false);
    if (err || !data) {
      setError(err?.message ?? "Failed to start enrollment. Try again.");
      return;
    }
    setQrCode(data.totp.qr_code);
    setFactorId(data.id);
    setIsEnrolling(true);
  }

  async function confirmEnrollment() {
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: verifyCode.trim(),
    });
    setBusy(false);
    if (err) {
      setError("Incorrect code. Check the app and try again.");
      return;
    }
    const { data: factors } = await supabase.auth.mfa.listFactors();
    for (const factor of factors?.totp ?? []) {
      if (factor.status !== "verified") {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
    }
    setMfaStatus("enrolled");
    setIsEnrolling(false);
    setQrCode("");
    setFactorId("");
    setVerifyCode("");
  }

  function cancelEnrollment() {
    if (factorId) {
      const supabase = createClient();
      void supabase.auth.mfa.unenroll({ factorId });
    }
    setIsEnrolling(false);
    setQrCode("");
    setFactorId("");
    setVerifyCode("");
    setError("");
  }

  async function removeMfa() {
    if (!window.confirm("Remove MFA? Your account will only require a password.")) return;
    setBusy(true);
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    const factor = (data?.totp ?? []).find((f) => f.status === "verified");
    if (factor) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
    setBusy(false);
    setMfaStatus("not_enrolled");
  }

  return (
    <div className="bg-white rounded-2xl border border-navy/8 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-navy">Two-Factor Authentication</h3>
          <p className="text-sm text-navy/45 mt-1">
            {mfaStatus === "checking"
              ? "Checking status..."
              : mfaStatus === "enrolled"
              ? "Your account requires a 6-digit code at every login."
              : "Protect your account with Google Authenticator or Authy."}
          </p>
        </div>
        {mfaStatus === "enrolled" && (
          <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-800">
            Active
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-brand-red">
          {error}
        </p>
      )}

      {mfaStatus === "not_enrolled" && !isEnrolling && (
        <div className="mt-4">
          <Button
            type="button"
            className="bg-navy text-white hover:bg-navy/90 rounded-full"
            onClick={startEnrollment}
            disabled={busy}
          >
            {busy ? "Setting up..." : "Enable Authenticator App"}
          </Button>
        </div>
      )}

      {mfaStatus === "not_enrolled" && isEnrolling && (
        <div className="mt-5 border-t border-navy/8 pt-5 space-y-4">
          <ol className="space-y-2">
            {[
              "Install Google Authenticator or Authy on your phone",
              "Tap + and choose Scan QR code",
              "Scan the QR code below, then enter the 6-digit code to confirm",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-red text-[9px] font-black text-white">
                  {i + 1}
                </span>
                <span className="text-sm text-navy/65 pt-0.5">{step}</span>
              </li>
            ))}
          </ol>

          {qrCode && (
            <div className="flex justify-center">
              <div className="rounded-xl border border-navy/10 p-3 bg-white inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="MFA QR code" width={140} height={140} />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="mfa-verify-code" className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-1.5">
              Enter the 6-digit code to confirm
            </label>
            <input
              id="mfa-verify-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl border border-navy/15 bg-offwhite px-4 py-3 text-center text-2xl font-black tracking-[0.3em] text-navy focus:outline-none focus:ring-2 focus:ring-brand-red/25"
              placeholder="000000"
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              className="bg-navy text-white hover:bg-navy/90 rounded-full"
              onClick={confirmEnrollment}
              disabled={busy || verifyCode.length !== 6}
            >
              {busy ? "Verifying..." : "Enable MFA"}
            </Button>
            <Button type="button" variant="outline" onClick={cancelEnrollment} disabled={busy} className="rounded-full">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {mfaStatus === "enrolled" && (
        <div className="mt-4 pt-4 border-t border-navy/8">
          <button
            type="button"
            onClick={removeMfa}
            disabled={busy}
            className="text-xs text-brand-red hover:text-brand-red/70 transition-colors"
          >
            {busy ? "Removing..." : "Remove MFA"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SettingsSection() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-red mb-1">
          Admin Dashboard
        </p>
        <h2 className="text-2xl font-black text-navy tracking-tight">Settings</h2>
        <p className="text-sm text-navy/45 mt-1">Manage your business info and security.</p>
      </div>
      <BusinessInfoSection />
      <MfaSection />
    </div>
  );
}
