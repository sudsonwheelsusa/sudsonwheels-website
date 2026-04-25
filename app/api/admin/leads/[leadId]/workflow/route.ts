import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";
import { adminLeadWorkflowSchema } from "@/lib/schemas/admin-workflow";
import { sendQuoteEmail, sendScheduledJobEmail } from "@/lib/email/send";
import { generateJobIcs } from "@/lib/ics";
import { getValidTokens, createCalendarEvent } from "@/lib/google/calendar";
import type { JobRecord, LeadRecord, GoogleTokens } from "@/lib/types";
import { createRatelimiter, getClientIp } from "@/lib/security/ratelimit";

const ratelimit = createRatelimiter(60, "1 m");

const leadSelect =
  "id, first_name, last_name, phone, email, service_id, service_name, location_address, location_lat, location_lng, message, status, internal_notes, quoted_amount, estimate_sent_at, approved_at, rejected_at, scheduled_job_id, completed_at, created_at";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  const ip = getClientIp(request);
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }
  }

  const adminIdentity = await requireAdmin();

  const { leadId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = adminLeadWorkflowSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }

  const input = result.data;
  const supabase = createAdminClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select(leadSelect)
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const leadUpdates: Record<string, unknown> = {
    internal_notes: input.internal_notes?.trim() || null,
  };

  let jobRecord: JobRecord | null = null;

  // State machine validation: ensure action is valid for current lead status
  const validTransitions: Record<string, string[]> = {
    approve: ["new", "quoted"],
    reject: ["new", "quoted"],
    quote: ["new"],
    schedule: ["approved"],
  };

  const allowedActions = validTransitions[input.action] || [];
  if (!allowedActions.includes(lead.status)) {
    return NextResponse.json(
      {
        error: `Cannot ${input.action} a lead with status "${lead.status}". ` +
               `Valid statuses: ${allowedActions.join(", ") || "none"}.`,
      },
      { status: 400 }
    );
  }

  if (input.action === "approve") {
    leadUpdates.status = "approved";
    leadUpdates.approved_at = now;
  }

  if (input.action === "reject") {
    leadUpdates.status = "rejected";
    leadUpdates.rejected_at = now;
  }

  if (input.action === "quote") {
    const quoteAmount = Number(input.quoted_amount);

    const { error: estimateError } = await supabase.from("estimates").insert({
      lead_id: leadId,
      amount: quoteAmount,
      notes: input.estimate_notes?.trim() || null,
      status: "sent",
      created_by: adminIdentity.userId,
      sent_at: now,
    });

    if (estimateError) {
      console.error("Estimate insert error:", estimateError);
      return NextResponse.json(
        { error: "Could not save the estimate." },
        { status: 500 }
      );
    }

    leadUpdates.status = "quoted";
    leadUpdates.quoted_amount = quoteAmount;
    leadUpdates.estimate_sent_at = now;
  }

  if (input.action === "schedule") {
    // Guard: prevent double-click by checking if a job already exists for this lead
    const { data: existingJob, error: existingJobError } = await supabase
      .from("jobs")
      .select("id")
      .eq("lead_id", leadId)
      .eq("status", "scheduled")
      .maybeSingle();

    if (existingJobError) {
      console.error("Job lookup error:", existingJobError);
      return NextResponse.json(
        { error: "Could not check for existing job." },
        { status: 500 }
      );
    }

    if (existingJob) {
      return NextResponse.json(
        { error: "A job is already scheduled for this lead." },
        { status: 409 }
      );
    }

    const { data: insertedJob, error: jobError } = await supabase
      .from("jobs")
      .insert({
        lead_id: leadId,
        title:
          input.title?.trim() ||
          `${lead.service_name} - ${lead.first_name} ${lead.last_name}`,
        status: "scheduled",
        scheduled_start: input.scheduled_start,
        scheduled_end: input.scheduled_end || null,
        service_name: lead.service_name,
        customer_name: `${lead.first_name} ${lead.last_name}`,
        location_address: lead.location_address,
        location_lat: lead.location_lat,
        location_lng: lead.location_lng,
        notes: input.estimate_notes?.trim() || input.internal_notes?.trim() || null,
        created_by: adminIdentity.userId,
      })
      .select(
        "id, lead_id, estimate_id, title, status, scheduled_start, scheduled_end, service_name, customer_name, location_address, location_lat, location_lng, notes, created_by, created_at, gcal_event_id, gcal_synced_at"
      )
      .single();

    if (jobError || !insertedJob) {
      console.error("Job insert error:", jobError);
      return NextResponse.json(
        { error: "Could not schedule the job." },
        { status: 500 }
      );
    }

    jobRecord = insertedJob satisfies JobRecord;
    leadUpdates.status = "scheduled";
    leadUpdates.scheduled_job_id = insertedJob.id;
    leadUpdates.approved_at = lead.approved_at ?? now;
  }

  const { data: updatedLead, error: updateError } = await supabase
    .from("leads")
    .update(leadUpdates)
    .eq("id", leadId)
    .select(leadSelect)
    .single();

  if (updateError || !updatedLead) {
    console.error("Lead update error:", updateError);
    return NextResponse.json(
      { error: "Could not update the lead." },
      { status: 500 }
    );
  }

  if (input.action === "quote" && updatedLead.quoted_amount) {
    void sendQuoteEmail({
      lead: updatedLead satisfies LeadRecord,
      amount: Number(updatedLead.quoted_amount),
      notes: input.estimate_notes,
    }).catch((error) => {
      console.error("Quote email failure:", error);
    });
  }

  if (input.action === "schedule" && jobRecord) {
    const icsContent = generateJobIcs(jobRecord);
    void sendScheduledJobEmail({
      lead: updatedLead satisfies LeadRecord,
      job: jobRecord,
      icsContent,
    }).catch((error) => {
      console.error("Scheduled job email failure:", error);
    });

    // Fire-and-forget: sync the new job to Google Calendar
    void (async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("google_tokens, google_calendar_id")
          .eq("id", adminIdentity.userId)
          .single();

        if (!profile?.google_tokens) return;

        const tokens = profile.google_tokens as GoogleTokens;
        const validTokens = await getValidTokens(tokens);
        const calendarId = (profile.google_calendar_id as string | null) ?? "primary";

        const event = await createCalendarEvent(validTokens, calendarId, {
          summary: jobRecord!.title,
          description: [
            `Customer: ${jobRecord!.customer_name}`,
            jobRecord!.location_address ? `Address: ${jobRecord!.location_address}` : null,
            jobRecord!.notes ? `Notes: ${jobRecord!.notes}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
          location: jobRecord!.location_address ?? undefined,
          start: {
            dateTime: jobRecord!.scheduled_start,
            timeZone: "America/New_York",
          },
          end: {
            dateTime: jobRecord!.scheduled_end ?? jobRecord!.scheduled_start,
            timeZone: "America/New_York",
          },
        });

        // Store the Google Calendar event ID on the job + update tokens if refreshed
        await supabase
          .from("jobs")
          .update({
            gcal_event_id: event.id,
            gcal_synced_at: new Date().toISOString(),
          })
          .eq("id", jobRecord!.id);

        if (validTokens.access_token !== tokens.access_token) {
          await supabase
            .from("profiles")
            .update({ google_tokens: validTokens })
            .eq("id", adminIdentity.userId);
        }
      } catch (err) {
        console.error("Google Calendar sync failed:", err);
      }
    })();
  }

  return NextResponse.json({
    success: true,
    lead: updatedLead,
    job: jobRecord,
  });
}
