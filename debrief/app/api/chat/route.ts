import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  buildMeetingChatSystemPrompt,
  getLastUserMessageContent,
  validateMeetingChatMessage,
} from "@/lib/prompt-guards";
import { chatRatelimit } from "@/lib/ratelimit";
import { checkRateLimit } from "@/lib/ratelimitHelper";

export const maxDuration = 120;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatTurn = { role: string; content: string };

function isChatTurn(value: unknown): value is ChatTurn {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.role === "string" &&
    typeof o.content === "string" &&
    (o.role === "user" || o.role === "assistant")
  );
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit(req, chatRatelimit);
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
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const transcript =
    "transcript" in body && typeof (body as { transcript: unknown }).transcript === "string"
      ? (body as { transcript: string }).transcript.trim()
      : "";

  if (!transcript) {
    return NextResponse.json(
      { error: "Provide a non-empty transcript string." },
      { status: 400 }
    );
  }

  const rawMessages = (body as { messages?: unknown }).messages;
  const messages: ChatTurn[] = Array.isArray(rawMessages)
    ? rawMessages.filter(isChatTurn)
    : [];

  const lastUser = getLastUserMessageContent(messages);
  if (lastUser === null) {
    return NextResponse.json(
      { error: "Include at least one user message." },
      { status: 400 }
    );
  }

  const guarded = validateMeetingChatMessage(lastUser, transcript);
  if (!guarded.ok) {
    return NextResponse.json({ error: guarded.error }, { status: guarded.status });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: buildMeetingChatSystemPrompt(transcript),
        },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });

    const reply = completion.choices[0]?.message?.content;
    if (!reply) {
      return NextResponse.json(
        { error: "No reply from the model." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Chat request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
