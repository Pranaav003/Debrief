import { NextRequest, NextResponse } from "next/server";
import { generalRatelimit } from "@/lib/ratelimit";
import { checkRateLimit } from "@/lib/ratelimitHelper";
import { generateSlug } from "@/lib/slugs";
import { supabaseAdmin } from "@/lib/supabase";
import type { ShareRole } from "@/lib/types";

const ROLES: ShareRole[] = ["viewer", "editor"];

function isShareRole(v: unknown): v is ShareRole {
  return typeof v === "string" && ROLES.includes(v as ShareRole);
}

function mapShareRow(s: {
  id: string;
  created_at: string;
  debrief_id: string;
  slug: string;
  role: string;
  label: string | null;
  is_active: boolean;
}) {
  return {
    id: s.id,
    createdAt: s.created_at,
    debriefId: s.debrief_id,
    slug: s.slug,
    role: s.role as ShareRole,
    label: s.label,
    isActive: s.is_active,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
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

  const { data, error } = await supabaseAdmin()
    .from("debrief_shares")
    .select("*")
    .eq("debrief_id", params.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const shares = (data ?? []).map((row) =>
    mapShareRow(
      row as {
        id: string;
        created_at: string;
        debrief_id: string;
        slug: string;
        role: string;
        label: string | null;
        is_active: boolean;
      }
    )
  );

  return NextResponse.json(shares);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitRes = await checkRateLimit(req, generalRatelimit);
  if (rateLimitRes) return rateLimitRes;

  const ownerToken = req.nextUrl.searchParams.get("ownerToken");
  if (!ownerToken) {
    return NextResponse.json({ error: "Missing ownerToken" }, { status: 400 });
  }

  const body = (await req.json()) as { role?: unknown; label?: unknown };
  const role = body.role;
  const label = typeof body.label === "string" ? body.label.trim() || null : null;

  if (!isShareRole(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
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

  let slug = generateSlug();
  let attempts = 0;
  while (attempts < 8) {
    const { data: existing } = await supabaseAdmin()
      .from("debrief_shares")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = generateSlug();
    attempts++;
  }

  const { data, error } = await supabaseAdmin()
    .from("debrief_shares")
    .insert({
      debrief_id: params.id,
      slug,
      role,
      label,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    mapShareRow(
      data as {
        id: string;
        created_at: string;
        debrief_id: string;
        slug: string;
        role: string;
        label: string | null;
        is_active: boolean;
      }
    )
  );
}
