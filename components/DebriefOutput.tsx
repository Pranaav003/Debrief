"use client";

import { useState } from "react";
import { ErrorMessage } from "@/components/ErrorMessage";
import type {
  BoardReviewResult,
  BrainstormResult,
  Debrief,
  DebriefShare,
  GeneralSyncResult,
  OneOnOneResult,
  SalesCallResult,
  ShareRole,
  StandupResult,
} from "@/lib/types";
import type { ActionItem, Decision, DebriefResult, MeetingType } from "@/lib/types";
import { DebriefHeader } from "@/components/DebriefHeader";
import { NotesPanel } from "@/components/NotesPanel";
import { SendDebriefModal } from "@/components/SendDebriefModal";
import {
  BoardReviewOutput,
  BrainstormOutput,
  GeneralSyncOutput,
  OneOnOneOutput,
  SalesCallOutput,
  StandupOutput,
} from "@/components/meeting-types/outputs";

type OutputCommon = {
  signalSaved: () => void;
  updateResultField: (debriefId: string, field: string, value: unknown) => void;
  updateArrayField: (
    debriefId: string,
    field: string,
    index: number,
    value: string
  ) => void;
  addArrayItem: (debriefId: string, field: string, item: unknown) => void;
  removeArrayItem: (debriefId: string, field: string, index: number) => void;
  toggleActionItem: (debriefId: string, actionItemId: string) => void;
  updateActionItem: (
    debriefId: string,
    actionItemId: string,
    updates: Partial<ActionItem>
  ) => void;
  updateDecision: (
    debriefId: string,
    decisionId: string,
    updates: Partial<Decision>
  ) => void;
  updateOpenQuestions: (debriefId: string, questions: string[]) => void;
  onOpenSendDebrief?: () => void;
};

type OutputCommonWithId = OutputCommon & { debriefId: string };

export type DebriefOutputProps = OutputCommon & {
  debrief: Debrief;
  updateTitle: (debriefId: string, title: string) => void;
  updateMeetingType: (debriefId: string, type: MeetingType) => void;
  updateNotes: (notes: string) => void;
  readOnly?: boolean;
  shareLinks?: {
    debriefId: string;
    shares: DebriefShare[];
    loading: boolean;
    createShare: (debriefId: string, role: ShareRole, label?: string) => Promise<DebriefShare>;
    revokeShare: (debriefId: string, shareId: string) => Promise<void>;
  };
  /** For “Send debrief” with share link in email. */
  ensureShareUrlForEmail?: () => Promise<string>;
  /** Persist/sync failure from useDebriefs */
  saveHookError?: string | null;
  onDismissSaveError?: () => void;
  onRetrySave?: () => void;
};

export function DebriefOutput({
  debrief,
  updateTitle,
  updateMeetingType,
  updateNotes,
  readOnly = false,
  shareLinks,
  ensureShareUrlForEmail,
  signalSaved,
  updateResultField,
  updateArrayField,
  addArrayItem,
  removeArrayItem,
  toggleActionItem,
  updateActionItem,
  updateDecision,
  updateOpenQuestions,
  saveHookError,
  onDismissSaveError,
  onRetrySave,
}: DebriefOutputProps) {
  const [sendModalOpen, setSendModalOpen] = useState(false);

  const common: OutputCommonWithId = {
    debriefId: debrief.id,
    signalSaved,
    updateResultField,
    updateArrayField,
    addArrayItem,
    removeArrayItem,
    toggleActionItem,
    updateActionItem,
    updateDecision,
    updateOpenQuestions,
    onOpenSendDebrief:
      readOnly || !ensureShareUrlForEmail ? undefined : () => setSendModalOpen(true),
  };

  const r = debrief.result as DebriefResult;

  return (
    <div className="space-y-6 md:space-y-8">
      {!readOnly && saveHookError ? (
        <ErrorMessage
          type="warning"
          message={`⚠ ${saveHookError}`}
          onRetry={onRetrySave}
          onDismiss={onDismissSaveError}
        />
      ) : null}
      <DebriefHeader
        debrief={debrief}
        onUpdateTitle={updateTitle}
        onUpdateAttendees={(id, attendees) =>
          updateResultField(id, "attendees", attendees)
        }
        onOverrideType={updateMeetingType}
        shareLinks={shareLinks}
        signalSaved={signalSaved}
        readOnly={readOnly}
      />

      {r.meetingType === "standup" ? (
        <StandupOutput {...common} result={r as StandupResult} readOnly={readOnly} />
      ) : r.meetingType === "sales_call" ? (
        <SalesCallOutput {...common} result={r as SalesCallResult} readOnly={readOnly} />
      ) : r.meetingType === "brainstorm" ? (
        <BrainstormOutput {...common} result={r as BrainstormResult} readOnly={readOnly} />
      ) : r.meetingType === "one_on_one" ? (
        <OneOnOneOutput {...common} result={r as OneOnOneResult} readOnly={readOnly} />
      ) : r.meetingType === "board_review" ? (
        <BoardReviewOutput {...common} result={r as BoardReviewResult} readOnly={readOnly} />
      ) : (
        <GeneralSyncOutput {...common} result={r as GeneralSyncResult} readOnly={readOnly} />
      )}

      {!readOnly ? (
        <NotesPanel
          notes={debrief.notes}
          updateNotes={updateNotes}
          onAfterSave={signalSaved}
        />
      ) : debrief.notes.trim() ? (
        <section className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-3 md:p-5">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Notes
          </h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
            {debrief.notes}
          </p>
        </section>
      ) : null}

      {!readOnly && ensureShareUrlForEmail ? (
        <SendDebriefModal
          open={sendModalOpen}
          onClose={() => setSendModalOpen(false)}
          debrief={debrief}
          ensureShareUrl={ensureShareUrlForEmail}
        />
      ) : null}
    </div>
  );
}

