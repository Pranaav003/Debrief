import type { Debrief, DebriefResult, MeetingType } from "@/lib/types";
import { parseDeBriefResult } from "@/lib/types";

export type DebriefRow = {
  id: string;
  created_at?: string;
  owner_token?: string;
  meeting_title?: string | null;
  meeting_type?: string | null;
  transcript?: string | null;
  result: unknown;
  notes?: string | null;
  chat_history?: unknown;
  is_public?: boolean;
  share_slug?: string | null;
};

export function isMeetingType(value: unknown): value is MeetingType {
  return (
    value === "standup" ||
    value === "sales_call" ||
    value === "brainstorm" ||
    value === "one_on_one" ||
    value === "board_review" ||
    value === "general_sync"
  );
}

export function isChatMessageEntry(
  value: unknown
): value is { role: "user" | "assistant"; content: string } {
  if (typeof value !== "object" || value === null) return false;
  const m = value as { role?: unknown; content?: unknown };
  return (
    (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
  );
}

/** Map a full debrief row from Supabase (API or admin) to {@link Debrief}. */
export function mapSupabaseRowToDebrief(row: DebriefRow): Debrief | null {
  const parsed = parseDeBriefResult(row.result);
  if (!parsed) return null;

  const meetingType: MeetingType = isMeetingType(row.meeting_type)
    ? row.meeting_type
    : parsed.meetingType;

  const meetingTitle =
    typeof row.meeting_title === "string" && row.meeting_title.trim()
      ? row.meeting_title
      : parsed.meetingTitle;

  const chatRaw = Array.isArray(row.chat_history) ? row.chat_history : [];
  const chatHistory = chatRaw.filter(isChatMessageEntry);

  const result = ({ ...(parsed as object), meetingType } as unknown) as DebriefResult;

  return {
    id: row.id,
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    meetingTitle,
    date: result.date,
    meetingType,
    transcript: typeof row.transcript === "string" ? row.transcript : "",
    result,
    notes: typeof row.notes === "string" ? row.notes : "",
    chatHistory,
    isPublic: row.is_public === true,
    shareSlug: row.share_slug ?? null,
  };
}
