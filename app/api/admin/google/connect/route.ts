import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { randomUUID } from "crypto";
import { createRatelimiter, getClientIp } from "@/lib/security/ratelimit";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

const ratelimit = createRatelimiter(10, "1 h");

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }
  }

  await requireAdmin();

  // Generate CSRF state token
  const state = randomUUID();

  // Store state in an encrypted, httpOnly, sameSite cookie (valid for 10 minutes)
  const response = NextResponse.redirect(
    `${GOOGLE_AUTH_URL}?${new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/google/callback`,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      state, // Include state in OAuth request
    }).toString()}`
  );

  // Set state cookie with secure, httpOnly, sameSite flags
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
