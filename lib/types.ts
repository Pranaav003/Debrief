import { formatTodayMeetingDate } from "@/lib/debrief-date";
import { generateShortId } from "@/lib/ids";

export type MeetingType =
  | "standup"
  | "sales_call"
  | "brainstorm"
  | "one_on_one"
  | "board_review"
  | "general_sync";

export type ActionItem = {
  id: string;
  task: string;
  owner: string | null;
  due: string | null;
  completed: boolean;
};

export type Decision = {
  id: string;
  decision: string;
  owner: string | null;
};

export interface FollowUpEmail {
  subject: string;
  body: string;
}

export type DebriefBase = {
  meetingTitle: string;
  date: string;
  meetingType: MeetingType;
  attendees: string[];
  summary: string;
  actionItems: ActionItem[];
  followUpEmail: FollowUpEmail;
};

export type StandupBlocker = { id: string; blocker: string; owner: string | null };
export type StandupResult = DebriefBase & {
  meetingType: "standup";
  shipped: string[];
  inProgress: string[];
  blockers: StandupBlocker[];
  upNext: string[];
};

export type SalesCallObjection = { objection: string; response: string | null };
export type SalesCallResult = DebriefBase & {
  meetingType: "sales_call";
  prospect: string;
  painPoints: string[];
  objections: SalesCallObjection[];
  nextSteps: string[];
  dealSignal: "hot" | "warm" | "cold" | "unknown";
};

export type BrainstormKilledIdea = { idea: string; reason: string | null };
export type BrainstormResult = DebriefBase & {
  meetingType: "brainstorm";
  topic: string;
  ideasGenerated: string[];
  ideasShortlisted: string[];
  ideasKilled: BrainstormKilledIdea[];
  openThreads: string[];
};

export type OneOnOneCommitment = { commitment: string; owner: string };
export type OneOnOneResult = DebriefBase & {
  meetingType: "one_on_one";
  participants: string[];
  feedbackThemes: string[];
  goalsDiscussed: string[];
  commitmentsMade: OneOnOneCommitment[];
  mood: "positive" | "neutral" | "tense" | "unknown";
};

export type BoardMetric = { metric: string; status: string };
export type BoardReviewResult = DebriefBase & {
  meetingType: "board_review";
  metricsDiscussed: BoardMetric[];
  strategicDecisions: Decision[];
  risksRaised: string[];
  concerns: string[];
};

export type GeneralSyncResult = DebriefBase & {
  meetingType: "general_sync";
  decisions: Decision[];
  openQuestions: string[];
};

export type DebriefResult =
  | StandupResult
  | SalesCallResult
  | BrainstormResult
  | OneOnOneResult
  | BoardReviewResult
  | GeneralSyncResult;

/** Back-compat name used across components */
export type DeBriefResult = DebriefResult;

export type ChatMessageRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
}

export type ShareRole = "viewer" | "editor";

export type DebriefShare = {
  id: string;
  createdAt: string;
  debriefId: string;
  slug: string;
  role: ShareRole;
  label: string | null;
  isActive: boolean;
};

/** Persisted sidebar item + detail view + chat */
export type Debrief = {
  id: string;
  createdAt?: string;
  meetingTitle: string;
  date: string;
  meetingType: MeetingType;
  transcript: string;
  result: DebriefResult;
  notes: string;
  chatHistory: { role: "user" | "assistant"; content: string }[];
  isPublic?: boolean;
  shareSlug?: string | null;
  /** Pinned meetings appear at the top of the sidebar */
  pinned?: boolean;
  /** Role-based share rows; loaded separately when managing links */
  shares?: DebriefShare[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : null;
}

function asMeetingType(value: unknown): MeetingType {
  return value === "standup" ||
    value === "sales_call" ||
    value === "brainstorm" ||
    value === "one_on_one" ||
    value === "board_review" ||
    value === "general_sync"
    ? value
    : "general_sync";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function resolveMeetingDate(raw: unknown): string {
  const s = asString(raw).trim();
  if (!s) {
    return formatTodayMeetingDate();
  }
  if (/^(unknown|n\/a|not specified|none|tbd|\?+)$/i.test(s)) {
    return formatTodayMeetingDate();
  }
  return s;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** Ensure ids and completed flags exist (API + legacy data). */
export function ensureDebriefResultShape(r: DebriefResult): DebriefResult {
  const actionItemsIn = Array.isArray(r.actionItems) ? r.actionItems : [];
  const base = {
    ...r,
    actionItems: actionItemsIn.map((a) => ({
      id: a.id?.trim() || generateShortId(),
      task: a.task ?? "",
      owner: a.owner ?? null,
      due: a.due ?? null,
      completed: asBoolean((a as { completed?: unknown }).completed, false),
    })),
  } as DebriefResult;

  if (base.meetingType === "general_sync") {
    const decisionsIn = Array.isArray(base.decisions) ? base.decisions : [];
    return {
      ...base,
      decisions: decisionsIn.map((d) => ({
        id: d.id?.trim() || generateShortId(),
        decision: d.decision ?? "",
        owner: d.owner ?? null,
      })),
      openQuestions: Array.isArray(base.openQuestions) ? base.openQuestions : [],
    };
  }

  if (base.meetingType === "board_review") {
    const strategicIn = Array.isArray(base.strategicDecisions)
      ? base.strategicDecisions
      : [];
    return {
      ...base,
      strategicDecisions: strategicIn.map((d) => ({
        id: d.id?.trim() || generateShortId(),
        decision: d.decision ?? "",
        owner: d.owner ?? null,
      })),
    };
  }

  if (base.meetingType === "standup") {
    const blockersIn = Array.isArray(base.blockers) ? base.blockers : [];
    return {
      ...base,
      blockers: blockersIn.map((b) => ({
        id: (b as { id?: unknown }).id && typeof (b as { id?: unknown }).id === "string"
          ? ((b as { id: string }).id.trim() || generateShortId())
          : generateShortId(),
        blocker: (b as { blocker?: unknown }).blocker && typeof (b as { blocker?: unknown }).blocker === "string"
          ? (b as { blocker: string }).blocker
          : "",
        owner: asStringOrNull((b as { owner?: unknown }).owner),
      })),
    };
  }

  return base;
}

export function parseDeBriefResult(raw: unknown): DebriefResult | null {
  if (!isRecord(raw)) return null;

  const followRaw = raw.followUpEmail;
  const follow = isRecord(followRaw)
    ? {
        subject: asString(followRaw.subject),
        body: asString(followRaw.body),
      }
    : { subject: "", body: "" };

  const actionsRaw = Array.isArray(raw.actionItems) ? raw.actionItems : [];
  const actionItems: ActionItem[] = actionsRaw.filter(isRecord).map((a) => ({
    id: typeof a.id === "string" && a.id.trim() ? a.id.trim() : generateShortId(),
    task: asString(a.task),
    owner: asStringOrNull(a.owner),
    due: asStringOrNull(a.due),
    completed: asBoolean(a.completed, false),
  }));

  const meetingType = asMeetingType(raw.meetingType);

  const base: DebriefBase = {
    meetingTitle: asString(raw.meetingTitle, "Meeting"),
    date: resolveMeetingDate(raw.date),
    meetingType,
    attendees: asStringArray(raw.attendees),
    summary: asString(raw.summary),
    actionItems,
    followUpEmail: follow,
  };

  // Legacy stored debriefs (pre-meetingType) should default to general_sync,
  // and often have decisions/openQuestions at the root.
  const legacyDecisionsRaw = Array.isArray(raw.decisions) ? raw.decisions : [];
  const legacyDecisions: Decision[] = legacyDecisionsRaw.filter(isRecord).map((d) => ({
    id: typeof d.id === "string" && d.id.trim() ? d.id.trim() : generateShortId(),
    decision: asString(d.decision),
    owner: asStringOrNull(d.owner),
  }));

  if (meetingType === "standup") {
    const blockersRaw = Array.isArray(raw.blockers) ? raw.blockers : [];
    const blockers: StandupBlocker[] = blockersRaw.filter(isRecord).map((b) => ({
      id: typeof b.id === "string" && b.id.trim() ? b.id.trim() : generateShortId(),
      blocker: asString(b.blocker),
      owner: asStringOrNull(b.owner),
    }));
    const r: StandupResult = {
      ...base,
      meetingType: "standup",
      shipped: asStringArray(raw.shipped),
      inProgress: asStringArray(raw.inProgress),
      blockers,
      upNext: asStringArray(raw.upNext),
    };
    return ensureDebriefResultShape(r);
  }

  if (meetingType === "sales_call") {
    const objectionsRaw = Array.isArray(raw.objections) ? raw.objections : [];
    const objections: SalesCallObjection[] = objectionsRaw.filter(isRecord).map((o) => ({
      objection: asString(o.objection),
      response: asStringOrNull(o.response),
    }));
    const dealSignal =
      raw.dealSignal === "hot" ||
      raw.dealSignal === "warm" ||
      raw.dealSignal === "cold" ||
      raw.dealSignal === "unknown"
        ? raw.dealSignal
        : "unknown";
    const r: SalesCallResult = {
      ...base,
      meetingType: "sales_call",
      prospect: asString(raw.prospect),
      painPoints: asStringArray(raw.painPoints),
      objections,
      nextSteps: asStringArray(raw.nextSteps),
      dealSignal,
    };
    return ensureDebriefResultShape(r);
  }

  if (meetingType === "brainstorm") {
    const killedRaw = Array.isArray(raw.ideasKilled) ? raw.ideasKilled : [];
    const ideasKilled: BrainstormKilledIdea[] = killedRaw.filter(isRecord).map((k) => ({
      idea: asString(k.idea),
      reason: asStringOrNull(k.reason),
    }));
    const r: BrainstormResult = {
      ...base,
      meetingType: "brainstorm",
      topic: asString(raw.topic),
      ideasGenerated: asStringArray(raw.ideasGenerated),
      ideasShortlisted: asStringArray(raw.ideasShortlisted),
      ideasKilled,
      openThreads: asStringArray(raw.openThreads),
    };
    return ensureDebriefResultShape(r);
  }

  if (meetingType === "one_on_one") {
    const commitsRaw = Array.isArray(raw.commitmentsMade) ? raw.commitmentsMade : [];
    const commitmentsMade: OneOnOneCommitment[] = commitsRaw.filter(isRecord).map((c) => ({
      commitment: asString(c.commitment),
      owner: asString(c.owner),
    }));
    const mood =
      raw.mood === "positive" ||
      raw.mood === "neutral" ||
      raw.mood === "tense" ||
      raw.mood === "unknown"
        ? raw.mood
        : "unknown";
    const r: OneOnOneResult = {
      ...base,
      meetingType: "one_on_one",
      participants: asStringArray(raw.participants),
      feedbackThemes: asStringArray(raw.feedbackThemes),
      goalsDiscussed: asStringArray(raw.goalsDiscussed),
      commitmentsMade,
      mood,
    };
    return ensureDebriefResultShape(r);
  }

  if (meetingType === "board_review") {
    const metricsRaw = Array.isArray(raw.metricsDiscussed) ? raw.metricsDiscussed : [];
    const metricsDiscussed: BoardMetric[] = metricsRaw.filter(isRecord).map((m) => ({
      metric: asString(m.metric),
      status: asString(m.status),
    }));
    const strategicRaw = Array.isArray(raw.strategicDecisions) ? raw.strategicDecisions : [];
    const strategicDecisions: Decision[] = strategicRaw.filter(isRecord).map((d) => ({
      id: typeof d.id === "string" && d.id.trim() ? d.id.trim() : generateShortId(),
      decision: asString(d.decision),
      owner: asStringOrNull(d.owner),
    }));
    const r: BoardReviewResult = {
      ...base,
      meetingType: "board_review",
      metricsDiscussed,
      strategicDecisions,
      risksRaised: asStringArray(raw.risksRaised),
      concerns: asStringArray(raw.concerns),
    };
    return ensureDebriefResultShape(r);
  }

  const r: GeneralSyncResult = {
    ...base,
    meetingType: "general_sync",
    decisions: legacyDecisions,
    openQuestions: asStringArray(raw.openQuestions),
  };
  return ensureDebriefResultShape(r);
}
