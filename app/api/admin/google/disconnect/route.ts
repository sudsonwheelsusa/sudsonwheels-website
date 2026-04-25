import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidTokens, stopWatchChannel } from "@/lib/google/calendar";
import type { GoogleTokens } from "@/lib/types";
import { createRatelimiter, getClientIp } from "@/lib/security/ratelimit";

const ratelimit = createRatelimiter(10, "1 h");

export async function DELETE(request: NextRequest) {
  const ip = getClientIp(request);
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }
  }

  let identity: { userId: string; email: string };
  try {
    identity = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("google_tokens, google_channel_id, google_resource_id")
    .eq("id", identity.userId)
    .single();

  // Best-effort: stop the push channel before clearing tokens
  if (
    profile?.google_tokens &&
    profile?.google_channel_id &&
    profile?.google_resource_id
  ) {
    try {
      const tokens = profile.google_tokens as GoogleTokens;
      const validTokens = await getValidTokens(tokens);
      await stopWatchChannel(
        validTokens,
        profile.google_channel_id as string,
        profile.google_resource_id as string
      );
    } catch (err) {
      console.error("Failed to stop push channel:", err);
    }
  }

  await supabase
    .from("profiles")
    .update({
      google_tokens: null,
      google_calendar_id: null,
      google_channel_id: null,
      google_resource_id: null,
      google_channel_expiry: null,
    })
    .eq("id", identity.userId);

  return NextResponse.json({ ok: true });
}
