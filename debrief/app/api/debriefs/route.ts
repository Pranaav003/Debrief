import { NextRequest, NextResponse } from "next/server";
import { generalRatelimit } from "@/lib/ratelimit";
import { checkRateLimit } from "@/lib/ratelimitHelper";
import { supabaseAdmin } from "@/lib/supabase";
import { generateSlug } from "@/lib/slugs";

/** Undici often surfaces as this string when Node cannot reach Supabase (paused project, bad URL). */
function publicSupabaseErrorMessage(message: string): string {
  if (/typeerror:\s*fetch failed/i.test(message.trim())) {
    return (
      "Could not reach Supabase from the server. Confirm the project is not paused and " +
      "that NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct."
    );
  }
  return message;
}

// POST — save a new debrief (service role; owner enforced by owner_token column)
export async function POST(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, generalRatelimit);
  if (rateLimitResponse) return rateLimitResponse;

  const body = (await req.json()) as Record<string, unknown>;
  const {
    ownerToken,
    meetingTitle,
    meetingType,
    transcript,
    result,
    notes,
    chatHistory,
  } = body;

  if (!ownerToken || typeof ownerToken !== "string" || !result) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin()
    .from("debriefs")
    .insert({
      owner_token: ownerToken,
      meeting_title: typeof meetingTitle === "string" ? meetingTitle : null,
      meeting_type: typeof meetingType === "string" ? meetingType : null,
      transcript: typeof transcript === "string" ? transcript : null,
      result,
      notes: typeof notes === "string" ? notes : "",
      chat_history: Array.isArray(chatHistory) ? chatHistory : [],
      is_public: false,
      share_slug: generateSlug(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: publicSupabaseErrorMessage(error.message) },
      { status: 500 }
    );
  }
  return NextResponse.json(data);
}

// GET — list all debriefs for an owner token
export async function GET(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, generalRatelimit);
  if (rateLimitResponse) return rateLimitResponse;

  const ownerToken = req.nextUrl.searchParams.get("ownerToken");

  if (!ownerToken) {
    return NextResponse.json({ error: "Missing ownerToken" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("debriefs")
    .select("id, created_at, meeting_title, meeting_type, is_public, share_slug")
    .eq("owner_token", ownerToken)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: publicSupabaseErrorMessage(error.message) },
      { status: 500 }
    );
  }
  return NextResponse.json(data ?? []);
}
