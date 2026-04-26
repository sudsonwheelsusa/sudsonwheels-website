import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getValidTokens,
  registerWatchChannel,
  stopWatchChannel,
} from "@/lib/google/calendar";
import { randomUUID } from "crypto";
import type { GoogleTokens } from "@/lib/types";
import { createRatelimiter, getClientIp } from "@/lib/security/ratelimit";

const ratelimit = createRatelimiter(60, "1 m");

export async function GET(request: NextRequest) {
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
    .select(
      "google_tokens, google_calendar_id, google_channel_id, google_channel_expiry, google_resource_id"
    )
    .eq("id", identity.userId)
    .single();

  if (!profile?.google_tokens) {
    return NextResponse.json({ connected: false });
  }

  const tokens = profile.google_tokens as GoogleTokens;

  // Lazily renew push channel if it expires within 24 hours
  const expiryMs = profile.google_channel_expiry as number | null;
  const renewSoon = expiryMs != null && expiryMs < Date.now() + 24 * 60 * 60 * 1000;

  if (renewSoon || !profile.google_channel_id) {
    try {
      const validTokens = await getValidTokens(tokens);
      const calendarId = (profile.google_calendar_id as string | null) ?? "primary";

      // Stop the old channel first if it exists
      if (profile.google_channel_id && profile.google_resource_id) {
        try {
          await stopWatchChannel(
            validTokens,
            profile.google_channel_id as string,
            profile.google_resource_id as string
          );
        } catch (err) {
          console.error("Failed to stop old push channel:", err);
        }
      }

      // Register new channel
      const newChannelId = randomUUID();
      const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/google/webhook`;
      const channel = await registerWatchChannel(
        validTokens,
        calendarId,
        webhookUrl,
        newChannelId
      );

      await supabase
        .from("profiles")
        .update({
          google_tokens: validTokens,
          google_channel_id: channel.channelId,
          google_resource_id: channel.resourceId,
          google_channel_expiry: channel.expiry_ms,
        })
        .eq("id", identity.userId);
    } catch (err) {
      console.error("Push channel renewal failed:", err);
    }
  }

  return NextResponse.json({ connected: true });
}
