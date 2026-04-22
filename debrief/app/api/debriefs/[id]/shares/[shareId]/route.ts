import { NextRequest, NextResponse } from "next/server";
import { generalRatelimit } from "@/lib/ratelimit";
import { checkRateLimit } from "@/lib/ratelimitHelper";
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; shareId: string } }
) {
  const rateLimitRes = await checkRateLimit(req, generalRatelimit);
  if (rateLimitRes) return rateLimitRes;

  const ownerToken = req.nextUrl.searchParams.get("ownerToken");
  if (!ownerToken) {
    return NextResponse.json({ error: "Missing ownerToken" }, { status: 400 });
  }

  const { data: debrief, error: debriefErr } = await supabaseAdmin()
    .from("debriefs")
    .select("id")
    .eq("id", params.id)
    .eq("owner_token", ownerToken)
    .maybeSingle();

  if (debriefErr || !debrief) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabaseAdmin()
    .from("debrief_shares")
    .update({ is_active: false })
    .eq("id", params.shareId)
    .eq("debrief_id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
