import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidTokens } from "@/lib/google/calendar";
import type { GoogleTokens } from "@/lib/types";
import { createRatelimiter, getClientIp } from "@/lib/security/ratelimit";

const ratelimit = createRatelimiter(120, "1 m");

export async function POST(request: NextRequest) {
  const channelToken = request.headers.get("X-Goog-Channel-Token");
  const channelId = request.headers.get("X-Goog-Channel-ID");
  const resourceState = request.headers.get("X-Goog-Resource-State");

  // Reject requests with wrong token
  if (channelToken !== process.env.GOOGLE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }
  }

  // "sync" is Google's initial handshake — acknowledge and do nothing
  if (resourceState === "sync") {
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();

  // Find the admin profile that owns this channel
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, google_tokens, google_calendar_id")
    .eq("google_channel_id", channelId)
    .single();

  if (!profile?.google_tokens) {
    return NextResponse.json({ error: "No matching profile" }, { status: 404 });
  }

  const tokens = profile.google_tokens as GoogleTokens;
  const calendarId = (profile.google_calendar_id as string | null) ?? "primary";

  let validTokens: GoogleTokens;
  try {
    validTokens = await getValidTokens(tokens);
  } catch (err) {
    console.error("Google token refresh failed in webhook:", err);
    return NextResponse.json({ error: "Token refresh failed" }, { status: 500 });
  }

  // Fetch events changed in the last 10 minutes
  // (webhook is a ping — we must query to find what changed)
  const updatedMin = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const eventsRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
      new URLSearchParams({ updatedMin, showDeleted: "true" }).toString(),
    {
      headers: { Authorization: `Bearer ${validTokens.access_token}` },
    }
  );

  if (!eventsRes.ok) {
    return NextResponse.json({ error: "Events fetch failed" }, { status: 500 });
  }

  type GoogleEvent = {
    id: string;
    status: string;
    start?: { dateTime?: string };
    end?: { dateTime?: string };
  };

  const { items = [] } = (await eventsRes.json()) as { items: GoogleEvent[] };

  for (const event of items) {
    if (event.status === "cancelled") {
      // Deleted in Google Calendar — cancel the job
      // SCOPE: Only update jobs linked to this profile's calendar to prevent owner confusion
      const { error } = await supabase
        .from("jobs")
        .update({
          status: "cancelled",
          gcal_synced_at: new Date().toISOString(),
        })
        .eq("gcal_event_id", event.id)
        .eq("created_by", profile.id as string)
        .eq("status", "scheduled"); // only cancel jobs that are still scheduled
      
      if (error) {
        console.error("Failed to cancel job from webhook:", error);
      }
    } else if (event.start?.dateTime && event.end?.dateTime) {
      // Rescheduled in Google Calendar — update job times
      // SCOPE: Only update jobs linked to this profile's calendar to prevent owner confusion
      const { error } = await supabase
        .from("jobs")
        .update({
          scheduled_start: event.start.dateTime,
          scheduled_end: event.end.dateTime,
          gcal_synced_at: new Date().toISOString(),
        })
        .eq("gcal_event_id", event.id)
        .eq("created_by", profile.id as string);
      
      if (error) {
        console.error("Failed to reschedule job from webhook:", error);
      }
    }
  }

  // Persist refreshed tokens if they changed
  if (validTokens.access_token !== tokens.access_token) {
    const { error } = await supabase
      .from("profiles")
      .update({ google_tokens: validTokens })
      .eq("id", profile.id as string);
    
    if (error) {
      console.error("Failed to persist refreshed tokens in webhook:", error);
    }
  }

  return NextResponse.json({ ok: true });
}
