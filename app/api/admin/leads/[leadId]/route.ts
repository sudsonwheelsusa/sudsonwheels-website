import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";
import { adminMarkDoneSchema } from "@/lib/schemas/admin-mark-done";
import { getValidTokens, deleteCalendarEvent } from "@/lib/google/calendar";
import type { GoogleTokens } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  const { userId: adminId } = await requireAdmin();

  const { leadId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = adminMarkDoneSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: updated, error: updateError } = await supabase
    .from("leads")
    .update({ completed_at: result.data.completed_at })
    .eq("id", leadId)
    .select("id, completed_at")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Could not update lead." }, { status: 500 });
  }

  // Fire-and-forget: delete the Google Calendar event when job is marked done
  void (async () => {
    try {
      const supabaseAdmin = createAdminClient();

      // Get the job linked to this lead
      const { data: job } = await supabaseAdmin
        .from("jobs")
        .select("id, gcal_event_id, created_by")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!job?.gcal_event_id) return;

      // Get admin profile for tokens using created_by from the job
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("google_tokens, google_calendar_id")
        .eq("id", job.created_by as string)
        .single();

      if (!profile?.google_tokens) return;

      const tokens = profile.google_tokens as GoogleTokens;
      const validTokens = await getValidTokens(tokens);
      const calendarId = (profile.google_calendar_id as string | null) ?? "primary";

      await deleteCalendarEvent(validTokens, calendarId, job.gcal_event_id as string);

      await supabaseAdmin
        .from("jobs")
        .update({ gcal_event_id: null, gcal_synced_at: new Date().toISOString() })
        .eq("id", job.id);
    } catch (err) {
      console.error("Google Calendar delete on mark-done failed:", err);
    }
  })();

  return NextResponse.json({ success: true, lead: updated });
}
