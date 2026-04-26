import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateJobIcs } from "@/lib/ics";
import { createRatelimiter, getClientIp } from "@/lib/security/ratelimit";

const ratelimit = createRatelimiter(60, "1 m");

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const ip = getClientIp(request);
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }
  }

  await requireAdmin();

  const { jobId } = await context.params;
  const supabase = createAdminClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, title, scheduled_start, scheduled_end, location_address, service_name, customer_name")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const ics = generateJobIcs(job);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="job-${jobId}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
