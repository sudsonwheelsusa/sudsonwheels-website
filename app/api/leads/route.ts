import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLeadNotificationEmails } from "@/lib/email/send";
import { leadSchema } from "@/lib/schemas/lead";
import type { LeadRecord } from "@/lib/types";

function getRatelimit() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (
    !url ||
    !token ||
    url.includes("your_upstash") ||
    token.includes("your_upstash")
  ) {
    return null;
  }

  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: false,
  });
}

async function verifyTurnstile(token: string) {
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    }
  );

  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "127.0.0.1";

  const ratelimit = getRatelimit();
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 }
      );
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = leadSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }

  const { turnstile_token, website, ...lead } = result.data;

  if (website) {
    return NextResponse.json({ success: true });
  }

  const turnstileOk = await verifyTurnstile(turnstile_token);
  if (!turnstileOk) {
    return NextResponse.json(
      { error: "Bot verification failed. Please try again." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, name")
    .eq("id", lead.service_id)
    .eq("is_active", true)
    .maybeSingle();

  if (serviceError || !service) {
    return NextResponse.json(
      { error: "Please choose a valid service." },
      { status: 400 }
    );
  }

  const duplicateCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: recentDuplicate } = await supabase
    .from("leads")
    .select("id")
    .eq("email", lead.email)
    .eq("phone", lead.phone)
    .gte("created_at", duplicateCutoff)
    .maybeSingle();

  if (recentDuplicate) {
    return NextResponse.json(
      { error: "We already received a recent request from this contact info." },
      { status: 429 }
    );
  }

  const { data: insertedLead, error: dbError } = await supabase
    .from("leads")
    .insert({
      ...lead,
      service_name: service.name,
      status: "new" as const,
    })
    .select(
      "id, first_name, last_name, phone, email, service_id, service_name, location_address, location_lat, location_lng, message, status, internal_notes, quoted_amount, estimate_sent_at, approved_at, rejected_at, scheduled_job_id, created_at"
    )
    .single();

  if (dbError) {
    console.error("Supabase insert error:", dbError);
    return NextResponse.json(
      { error: "Could not save your request. Please try again." },
      { status: 500 }
    );
  }

  void sendLeadNotificationEmails(insertedLead satisfies LeadRecord).catch(
    (error) => {
      console.error("Lead email failure:", error);
    }
  );

  return NextResponse.json({ success: true });
}
