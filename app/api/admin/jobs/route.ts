import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";
import { generateOccurrences } from "@/lib/jobs/recurrence";
import { createCalendarEvent, getValidTokens } from "@/lib/google/calendar";
import type { GoogleTokens, RecurrenceRule } from "@/lib/types";

const RecurrenceRuleSchema = z.object({
  freq: z.enum(["daily", "weekly", "monthly"]),
  interval: z.number().int().min(1).max(52),
  days: z.array(z.enum(["sun","mon","tue","wed","thu","fri","sat"])).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const CreateJobSchema = z.object({
  title: z.string().min(1).max(200),
  customer_name: z.string().min(1).max(200),
  service_name: z.string().min(1).max(200),
  location_address: z.string().max(500).optional(),
  scheduled_start: z.string().datetime(),
  scheduled_end: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  recurrence: RecurrenceRuleSchema.optional(),
});

export async function POST(request: NextRequest) {
  let adminUser: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    adminUser = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { title, customer_name, service_name, location_address, scheduled_start, scheduled_end, notes, recurrence } = parsed.data;

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("google_tokens, google_calendar_id")
    .eq("id", adminUser.userId)
    .single();

  const tokens = profile?.google_tokens as GoogleTokens | null;
  const calendarId = (profile?.google_calendar_id as string | null) ?? "primary";

  async function pushToCalendar(start: string, end: string | null, jobTitle: string) {
    if (!tokens) return null;
    try {
      const valid = await getValidTokens(tokens);
      const event = await createCalendarEvent(valid, calendarId, {
        summary: jobTitle,
        description: notes ?? undefined,
        location: location_address ?? undefined,
        start: { dateTime: start, timeZone: "America/New_York" },
        end: { dateTime: end ?? start, timeZone: "America/New_York" },
      });
      return event.id;
    } catch (err) {
      console.error("Google Calendar push failed:", err);
      return null;
    }
  }

  const baseRow = {
    title,
    customer_name,
    service_name,
    location_address: location_address ?? null,
    notes: notes ?? null,
    status: "scheduled" as const,
    created_by: adminUser.userId,
    lead_id: null,
  };

  if (!recurrence) {
    const gcal_event_id = await pushToCalendar(scheduled_start, scheduled_end ?? null, title);
    const { data, error } = await supabase
      .from("jobs")
      .insert({ ...baseRow, scheduled_start, scheduled_end: scheduled_end ?? null, gcal_event_id })
      .select()
      .single();

    if (error) {
      console.error("Insert job failed:", error);
      return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
    }
    return NextResponse.json({ job: data });
  }

  const firstStart = new Date(scheduled_start);
  const firstEnd = scheduled_end ? new Date(scheduled_end) : null;
  const occurrences = generateOccurrences(recurrence as RecurrenceRule, firstStart, firstEnd);

  if (occurrences.length === 0) {
    return NextResponse.json({ error: "Recurrence rule produced no occurrences" }, { status: 400 });
  }

  const firstOcc = occurrences[0];
  const parentGcalId = await pushToCalendar(firstOcc.start.toISOString(), firstOcc.end?.toISOString() ?? null, title);
  const { data: parent, error: parentError } = await supabase
    .from("jobs")
    .insert({
      ...baseRow,
      scheduled_start: firstOcc.start.toISOString(),
      scheduled_end: firstOcc.end?.toISOString() ?? null,
      recurrence_rule: recurrence,
      gcal_event_id: parentGcalId,
    })
    .select()
    .single();

  if (parentError || !parent) {
    console.error("Insert parent job failed:", parentError);
    return NextResponse.json({ error: "Failed to create job series" }, { status: 500 });
  }

  const instanceRows = await Promise.all(
    occurrences.slice(1).map(async (occ) => {
      const gcal_event_id = await pushToCalendar(occ.start.toISOString(), occ.end?.toISOString() ?? null, title);
      return {
        ...baseRow,
        scheduled_start: occ.start.toISOString(),
        scheduled_end: occ.end?.toISOString() ?? null,
        parent_job_id: parent.id,
        gcal_event_id,
      };
    }),
  );

  if (instanceRows.length > 0) {
    const { error: instancesError } = await supabase.from("jobs").insert(instanceRows);
    if (instancesError) {
      console.error("Insert instances failed:", instancesError);
    }
  }

  return NextResponse.json({ job: parent, instances_created: instanceRows.length });
}
