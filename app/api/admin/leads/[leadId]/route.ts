import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminMarkDoneSchema } from "@/lib/schemas/admin-mark-done";

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  const adminId = await getAdminUserId();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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

  return NextResponse.json({ success: true, lead: updated });
}
