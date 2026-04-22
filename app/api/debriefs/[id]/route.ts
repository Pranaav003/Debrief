import { NextRequest, NextResponse } from "next/server";
import { generalRatelimit } from "@/lib/ratelimit";
import { checkRateLimit } from "@/lib/ratelimitHelper";
import { supabaseAdmin } from "@/lib/supabase";
import type { ShareRole } from "@/lib/types";

// GET — full debrief by id (only for owner)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResponse = await checkRateLimit(req, generalRatelimit);
  if (rateLimitResponse) return rateLimitResponse;

  const ownerToken = req.nextUrl.searchParams.get("ownerToken");
  if (!ownerToken) {
    return NextResponse.json({ error: "Missing ownerToken" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("debriefs")
    .select("*")
    .eq("id", params.id)
    .eq("owner_token", ownerToken)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH — update fields (notes, chat_history, result, is_public)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResponse = await checkRateLimit(req, generalRatelimit);
  if (rateLimitResponse) return rateLimitResponse;

  const ownerToken = req.nextUrl.searchParams.get("ownerToken");
  const shareSlug = req.nextUrl.searchParams.get("shareSlug");

  const updates = (await req.json()) as Record<string, unknown>;

  const allowed: Record<string, string> = {
    notes: "notes",
    chatHistory: "chat_history",
    result: "result",
    isPublic: "is_public",
    meetingTitle: "meeting_title",
    meetingType: "meeting_type",
  };

  const dbUpdates: Record<string, unknown> = {};
  for (const [key, dbKey] of Object.entries(allowed)) {
    if (key in updates) dbUpdates[dbKey] = updates[key];
  }

  if (ownerToken) {
    const { data, error } = await supabaseAdmin()
      .from("debriefs")
      .update(dbUpdates)
      .eq("id", params.id)
      .eq("owner_token", ownerToken)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (shareSlug) {
    const { data: share, error: shareErr } = await supabaseAdmin()
      .from("debrief_shares")
      .select("debrief_id, role, is_active")
      .eq("slug", shareSlug)
      .maybeSingle();

    if (
      shareErr ||
      !share ||
      !share.is_active ||
      share.debrief_id !== params.id ||
      (share.role as ShareRole) !== "editor"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if ("isPublic" in updates) {
      return NextResponse.json(
        { error: "Cannot change visibility via share link" },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin()
      .from("debriefs")
      .update(dbUpdates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json(
    { error: "Missing ownerToken or shareSlug" },
    { status: 400 }
  );
}

// DELETE
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResponse = await checkRateLimit(req, generalRatelimit);
  if (rateLimitResponse) return rateLimitResponse;

  const ownerToken = req.nextUrl.searchParams.get("ownerToken");
  if (!ownerToken) {
    return NextResponse.json({ error: "Missing ownerToken" }, { status: 400 });
  }

  const { error } = await supabaseAdmin()
    .from("debriefs")
    .delete()
    .eq("id", params.id)
    .eq("owner_token", ownerToken);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
