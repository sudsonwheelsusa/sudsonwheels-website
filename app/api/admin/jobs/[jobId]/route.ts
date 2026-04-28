import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";
import { deleteCalendarEvent, updateCalendarEvent, getValidTokens } from "@/lib/google/calendar";
import type { GoogleTokens } from "@/lib/types";

const PatchJobSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("reschedule"),
    scheduled_start: z.string().datetime(),
    scheduled_end: z.string().datetime().optional(),
  }),
  z.object({
    action: z.literal("complete"),
    units_completed: z.number().int().min(1),
    rate_per_unit: z.number().min(0),
  }),
  z.object({
    action: z.literal("cancel"),
  }),
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  let adminUser: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    adminUser = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = PatchJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: job } = await supabase.from("jobs").select("*").eq("id", jobId).single();
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("google_tokens, google_calendar_id")
    .eq("id", adminUser.userId)
    .single();
  const tokens = profile?.google_tokens as GoogleTokens | null;
  const calendarId = (profile?.google_calendar_id as string | null) ?? "primary";

  const { action } = parsed.data;

  if (action === "reschedule") {
    const { scheduled_start, scheduled_end } = parsed.data;
    const { error } = await supabase
      .from("jobs")
      .update({ scheduled_start, scheduled_end: scheduled_end ?? null })
      .eq("id", jobId);
    if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });

    if (tokens && job.gcal_event_id) {
      try {
        const valid = await getValidTokens(tokens);
        await updateCalendarEvent(valid, calendarId, job.gcal_event_id as string, {
          start: { dateTime: scheduled_start, timeZone: "America/New_York" },
          end: { dateTime: scheduled_end ?? scheduled_start, timeZone: "America/New_York" },
        });
      } catch (err) { console.error("GCal update failed:", err); }
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "complete") {
    const { units_completed, rate_per_unit } = parsed.data;
    const total_revenue = Number((units_completed * rate_per_unit).toFixed(2));
    const { error } = await supabase
      .from("jobs")
      .update({ status: "completed", units_completed, rate_per_unit, total_revenue })
      .eq("id", jobId);
    if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });
    return NextResponse.json({ ok: true, total_revenue });
  }

  if (action === "cancel") {
    const { error } = await supabase.from("jobs").update({ status: "cancelled" }).eq("id", jobId);
    if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });

    // If this job is linked to a lead, reset the lead's scheduled_job_id and status back to 'quoted'
    if (job.lead_id) {
      await supabase
        .from("leads")
        .update({ scheduled_job_id: null, status: "quoted" })
        .eq("id", job.lead_id);
    }

    if (tokens && job.gcal_event_id) {
      try {
        const valid = await getValidTokens(tokens);
        await deleteCalendarEvent(valid, calendarId, job.gcal_event_id as string);
      } catch (err) { console.error("GCal delete failed:", err); }
    }
    return NextResponse.json({ ok: true });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  let adminUser: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    adminUser = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;
  const scope = new URL(request.url).searchParams.get("scope");
  const supabase = createAdminClient();

  const { data: targetJob } = await supabase.from("jobs").select("*").eq("id", jobId).single();
  if (!targetJob) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("google_tokens, google_calendar_id")
    .eq("id", adminUser.userId)
    .single();
  const tokens = profile?.google_tokens as GoogleTokens | null;
  const calendarId = (profile?.google_calendar_id as string | null) ?? "primary";

  if (scope !== "series") {
    await supabase.from("jobs").update({ status: "cancelled" }).eq("id", jobId);
    
    // If this job is linked to a lead, reset the lead
    if (targetJob.lead_id) {
      await supabase
        .from("leads")
        .update({ scheduled_job_id: null, status: "quoted" })
        .eq("id", targetJob.lead_id);
    }

    if (tokens && targetJob.gcal_event_id) {
      try {
        const valid = await getValidTokens(tokens);
        await deleteCalendarEvent(valid, calendarId, targetJob.gcal_event_id as string);
      } catch (err) { console.error("GCal delete failed:", err); }
    }
    return NextResponse.json({ ok: true });
  }

  // Cancel entire series — resolve parent ID from this row or use this row's id
  const parentId = (targetJob.parent_job_id as string | null) ?? jobId;

  const { data: allJobs } = await supabase
    .from("jobs")
    .select("id, gcal_event_id, lead_id")
    .or(`id.eq.${parentId},parent_job_id.eq.${parentId}`)
    .neq("status", "cancelled");

  if (allJobs && allJobs.length > 0) {
    const ids = allJobs.map((j: { id: string }) => j.id);
    await supabase.from("jobs").update({ status: "cancelled" }).in("id", ids);

    // Reset all associated leads
    const leadIds = allJobs
      .filter((j: { lead_id?: string | null }) => j.lead_id)
      .map((j: { lead_id?: string | null }) => j.lead_id);
    
    if (leadIds.length > 0) {
      await supabase
        .from("leads")
        .update({ scheduled_job_id: null, status: "quoted" })
        .in("id", leadIds);
    }

    if (tokens) {
      for (const j of allJobs) {
        if (j.gcal_event_id) {
          try {
            const valid = await getValidTokens(tokens);
            await deleteCalendarEvent(valid, calendarId, j.gcal_event_id as string);
          } catch (err) { console.error("GCal delete failed for", j.id, err); }
        }
      }
    }
  }

  return NextResponse.json({ ok: true, cancelled: allJobs?.length ?? 0 });
}
