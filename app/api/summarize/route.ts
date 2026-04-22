import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { checkDailyLimit, incrementDailyCount } from "@/lib/dailyUsage";
import { aiRatelimit } from "@/lib/ratelimit";
import { checkRateLimit } from "@/lib/ratelimitHelper";
import { buildDebriefSystemPrompt, formatTodayMeetingDate } from "@/lib/debrief-date";
import { CLASSIFY_PROMPT, DEBRIEF_PROMPTS } from "@/lib/prompts";
import type { MeetingType } from "@/lib/types";
import { parseDeBriefResult } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, aiRatelimit);
  if (rateLimitResponse) return rateLimitResponse;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Server is not configured with OPENAI_API_KEY." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const transcript =
    typeof body === "object" &&
    body !== null &&
    "transcript" in body &&
    typeof (body as { transcript: unknown }).transcript === "string"
      ? (body as { transcript: string }).transcript.trim()
      : "";
  const ownerToken =
    typeof body === "object" &&
    body !== null &&
    "ownerToken" in body &&
    typeof (body as { ownerToken: unknown }).ownerToken === "string"
      ? (body as { ownerToken: string }).ownerToken.trim()
      : "";

  if (!transcript || !ownerToken) {
    return NextResponse.json(
      { error: "Provide non-empty \"transcript\" and \"ownerToken\" strings." },
      { status: 400 }
    );
  }

  const limitCheck = await checkDailyLimit(ownerToken);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: "daily_limit_reached",
        current: limitCheck.current,
        limit: limitCheck.limit,
        resetsAt: limitCheck.resetsAt,
      },
      { status: 403 }
    );
  }

  try {
    // Step 1: Classify meeting type
    const classifyResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: CLASSIFY_PROMPT },
        { role: "user", content: transcript },
      ],
      response_format: { type: "json_object" },
      max_tokens: 50,
    });

    const classifyContent = classifyResponse.choices[0]?.message?.content;
    if (!classifyContent) {
      return NextResponse.json(
        { error: "No content returned from the model." },
        { status: 502 }
      );
    }

    let meetingType: MeetingType | undefined;
    try {
      const parsed = JSON.parse(classifyContent) as { meetingType?: unknown; error?: unknown };
      if (parsed.error === "invalid_input") {
        return NextResponse.json(
          { error: "This doesn't look like a meeting transcript. Paste a real transcript to continue." },
          { status: 400 }
        );
      }
      meetingType =
        parsed.meetingType === "standup" ||
        parsed.meetingType === "sales_call" ||
        parsed.meetingType === "brainstorm" ||
        parsed.meetingType === "one_on_one" ||
        parsed.meetingType === "board_review" ||
        parsed.meetingType === "general_sync"
          ? parsed.meetingType
          : undefined;
    } catch {
      return NextResponse.json(
        { error: "Model returned invalid JSON." },
        { status: 502 }
      );
    }

    const resolvedType: MeetingType = meetingType ?? "general_sync";

    // Step 2: Generate type-specific debrief
    const todayStr = formatTodayMeetingDate();
    const systemPrompt = buildDebriefSystemPrompt(DEBRIEF_PROMPTS[resolvedType]);

    const debriefResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcript },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const debriefContent = debriefResponse.choices[0]?.message?.content;
    if (!debriefContent) {
      return NextResponse.json(
        { error: "No content returned from the model." },
        { status: 502 }
      );
    }

    let result: unknown;
    try {
      result = JSON.parse(debriefContent) as unknown;
    } catch {
      return NextResponse.json(
        { error: "Model returned invalid JSON." },
        { status: 502 }
      );
    }

    if (
      typeof result === "object" &&
      result !== null &&
      "error" in (result as Record<string, unknown>) &&
      (result as Record<string, unknown>).error === "invalid_input"
    ) {
      return NextResponse.json(
        { error: "This doesn't look like a meeting transcript. Paste a real transcript to continue." },
        { status: 400 }
      );
    }

    const parsed = parseDeBriefResult({
      ...(typeof result === "object" && result !== null ? (result as object) : {}),
      meetingType: resolvedType,
    });
    if (!parsed) {
      return NextResponse.json(
        { error: "Could not parse model output as DeBrief JSON." },
        { status: 502 }
      );
    }

    const dateStr = parsed.date.trim();
    const placeholder =
      !dateStr ||
      /^(unknown|n\/a|not specified|none|tbd|\?+)$/i.test(dateStr);
    const withDate = placeholder ? { ...parsed, date: todayStr } : parsed;

    await incrementDailyCount(ownerToken);
    return NextResponse.json({ ...withDate, meetingType: resolvedType });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Summarization failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
