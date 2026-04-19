import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { leadSchema } from "@/lib/schemas/lead";

function getRatelimit() {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    analytics: false,
  });
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

async function verifyTurnstile(token: string): Promise<boolean> {
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
  const data = await res.json();
  return data.success === true;
}

export async function POST(request: NextRequest) {
  // 1. Rate limit by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "127.0.0.1";

  const { success: withinLimit } = await getRatelimit().limit(ip);
  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  // 2. Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // 3. Validate with Zod
  const result = leadSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }

  const { turnstile_token, ...lead } = result.data;

  // 4. Verify Turnstile
  const turnstileOk = await verifyTurnstile(turnstile_token);
  if (!turnstileOk) {
    return NextResponse.json(
      { error: "Bot verification failed. Please try again." },
      { status: 400 }
    );
  }

  // 5. Insert into Supabase
  const supabase = await createClient();
  const { error: dbError } = await supabase.from("leads").insert(lead);
  if (dbError) {
    console.error("Supabase insert error:", dbError);
    return NextResponse.json(
      { error: "Could not save your request. Please try again." },
      { status: 500 }
    );
  }

  // 6. Send notification email
  await getResend().emails.send({
    from: "SudsOnWheels <noreply@sudsonwheelsusa.com>",
    to: process.env.OWNER_EMAIL!,
    subject: `New quote request — ${lead.first_name} ${lead.last_name}`,
    text: [
      `Name: ${lead.first_name} ${lead.last_name}`,
      `Phone: ${lead.phone}`,
      `Email: ${lead.email}`,
      `Service: ${lead.service}`,
      lead.message ? `Message: ${lead.message}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return NextResponse.json({ success: true });
}
