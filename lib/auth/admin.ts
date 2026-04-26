import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AdminIdentity {
  userId: string;
  email: string;
}

export const getAdminIdentity = cache(async (): Promise<AdminIdentity | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) return null;

  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;

  if (!userId || !email) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") return null;

  // Enforce AAL2 if MFA is enrolled
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasMfa = (factors?.totp ?? []).some((f) => f.status === "verified");

  if (hasMfa) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") return null;
  }

  return { userId, email };
});

export async function requireAdmin() {
  const identity = await getAdminIdentity();
  if (!identity) {
    redirect("/portal");
  }
  return identity;
}
