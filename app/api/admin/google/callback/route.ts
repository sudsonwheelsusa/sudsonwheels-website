import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { registerWatchChannel, stopWatchChannel, getValidTokens } from "@/lib/google/calendar";
import { randomUUID } from "crypto";
import type { GoogleTokens } from "@/lib/types";
import { createRatelimiter, getClientIp } from "@/lib/security/ratelimit";

const BASE = () => process.env.NEXT_PUBLIC_BASE_URL!;

const ratelimit = createRatelimiter(10, "1 h");

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
    return NextResponse.redirect(`${BASE()}/portal`);
  }

  // Validate CSRF state parameter
  const state = request.nextUrl.searchParams.get("state");
  const stateCookie = request.cookies.get("google_oauth_state")?.value;

  if (!state || !stateCookie || state !== stateCookie) {
    return NextResponse.redirect(
      `${BASE()}/portal/dashboard?gcal=error&reason=csrf`
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${BASE()}/portal/dashboard?gcal=error`);
  }

  // Exchange authorization code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${BASE()}/api/admin/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${BASE()}/portal/dashboard?gcal=error`);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  if (!tokenData.refresh_token) {
    return NextResponse.redirect(
      `${BASE()}/portal/dashboard?gcal=error&reason=no_refresh`
    );
  }

  const tokens: GoogleTokens = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry_ms: Date.now() + tokenData.expires_in * 1000 - 60_000,
  };

  const supabase = createAdminClient();

  // Stop existing push channel before registering a new one
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("google_tokens, google_channel_id, google_resource_id")
    .eq("id", identity.userId)
    .single();

  if (
    existingProfile?.google_tokens &&
    existingProfile?.google_channel_id &&
    existingProfile?.google_resource_id
  ) {
    try {
      const existingTokens = existingProfile.google_tokens as GoogleTokens;
      const validTokens = await getValidTokens(existingTokens);
      await stopWatchChannel(
        validTokens,
        existingProfile.google_channel_id as string,
        existingProfile.google_resource_id as string
      );
    } catch (err) {
      console.error("Failed to stop existing push channel:", err);
    }
  }

  // Register a new push notification channel with Google
  const channelId = randomUUID();
  const webhookUrl = `${BASE()}/api/admin/google/webhook`;

  let channelData = { channelId: "", resourceId: "", expiry_ms: 0 };
  try {
    channelData = await registerWatchChannel(tokens, "primary", webhookUrl, channelId);
  } catch (err) {
    console.error("Failed to register Google push channel:", err);
  }

  const response = NextResponse.redirect(
    `${BASE()}/portal/dashboard?gcal=connected`
  );

  // Clear state cookie
  response.cookies.delete("google_oauth_state");

  await supabase
    .from("profiles")
    .update({
      google_tokens: tokens,
      google_calendar_id: "primary",
      google_channel_id: channelData.channelId || null,
      google_resource_id: channelData.resourceId || null,
      google_channel_expiry: channelData.expiry_ms || null,
    })
    .eq("id", identity.userId);

  return response;
}
