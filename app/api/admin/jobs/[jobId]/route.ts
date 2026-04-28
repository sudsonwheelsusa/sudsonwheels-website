import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getAdminUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error) return null;
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (!userId) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return !profileError && profile?.role === "admin" ? userId : null;
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const adminId = await getAdminUserId();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { jobId } = await context.params;
  const supabase = createAdminClient();

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, lead_id")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("jobs")
    .delete()
    .eq("id", jobId);

  if (deleteError) {
    console.error("Job delete error:", deleteError);
    return NextResponse.json({ error: "Could not cancel job." }, { status: 500 });
  }

  if (job.lead_id) {
    const { error: leadError } = await supabase
      .from("leads")
      .update({ status: "quoted", scheduled_job_id: null, approved_at: null })
      .eq("id", job.lead_id);

    if (leadError) {
      console.error("Lead reset error:", leadError);
    }
  }

  return NextResponse.json({ success: true });
}
