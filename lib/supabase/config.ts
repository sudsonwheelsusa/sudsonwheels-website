function decodeJwtPayload(segment: string) {
  try {
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

    if (typeof globalThis.atob === "function") {
      return JSON.parse(globalThis.atob(padded));
    }

    if (typeof Buffer !== "undefined") {
      return JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
    }
  } catch {
    return null;
  }

  return null;
}

function isServiceRoleLikeKey(value: string) {
  if (value.startsWith("sb_secret_")) {
    return true;
  }

  const [, payloadSegment] = value.split(".");
  if (!payloadSegment) {
    return false;
  }

  const payload = decodeJwtPayload(payloadSegment);
  return payload?.role === "service_role";
}

export function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!value) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  return value;
}

export function getSupabasePublicKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!value) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  if (isServiceRoleLikeKey(value)) {
    throw new Error(
      "The public Supabase key is misconfigured: a service-role key was provided in a NEXT_PUBLIC_* variable."
    );
  }

  return value;
}

export function getSupabaseServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!value) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return value;
}

export function validateServerEnvironment() {
  getSupabaseUrl();
  getSupabasePublicKey();
}
