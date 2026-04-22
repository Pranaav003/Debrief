"use client";

import { useState } from "react";
import type { Debrief } from "@/lib/types";
import { formatFullDeBriefText } from "@/lib/format-debrief-text";
import { MeetingTypeBadge } from "@/components/MeetingTypeBadge";
import { EditableField } from "@/components/EditableField";
import { ShareButton } from "@/components/ShareButton";
import type { DebriefShare, ShareRole } from "@/lib/types";

function parseAttendeeList(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function AttendeesLine({
  attendees,
  onSave,
}: {
  attendees: string[];
  onSave: (next: string[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => attendees.join(", "));

  if (editing) {
    return (
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
        onBlur={() => {
          onSave(parseAttendeeList(draft));
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
          if (e.key === "Escape") {
            setDraft(attendees.join(", "));
            setEditing(false);
          }
        }}
        className="w-full rounded border border-[#3a3a3a] bg-[#2a2a2a] px-2 py-1.5 text-sm text-zinc-200 outline-none"
      />
    );
  }

  return (
    <div
      className="group/att relative flex cursor-text flex-wrap items-center gap-1.5"
      onClick={() => {
        setDraft(attendees.join(", "));
        setEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setDraft(attendees.join(", "));
          setEditing(true);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <span className="text-sm font-medium text-zinc-500">Attendees: </span>
      {attendees.length === 0 ? (
        <span className="text-sm text-zinc-500">— click to add</span>
      ) : (
        attendees.map((a, i) => (
          <span
            key={`${i}-${a}`}
            className="rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-0.5 text-xs text-zinc-300"
          >
            {a}
          </span>
        ))
      )}
    </div>
  );
}

export type DebriefHeaderProps = {
  debrief: Debrief;
  onUpdateTitle: (debriefId: string, title: string) => void;
  onUpdateAttendees: (debriefId: string, attendees: string[]) => void;
  onOverrideType: (debriefId: string, type: Debrief["meetingType"]) => void;
  signalSaved: () => void;
  readOnly?: boolean;
  /** Role-based share links (owner app only). */
  shareLinks?: {
    debriefId: string;
    shares: DebriefShare[];
    loading: boolean;
    createShare: (debriefId: string, role: ShareRole, label?: string) => Promise<DebriefShare>;
    revokeShare: (debriefId: string, shareId: string) => Promise<void>;
  };
};

export function DebriefHeader({
  debrief,
  onUpdateTitle,
  onUpdateAttendees,
  onOverrideType,
  signalSaved,
  readOnly = false,
  shareLinks,
}: DebriefHeaderProps) {
  const [fullCopied, setFullCopied] = useState(false);

  async function copyFull() {
    await navigator.clipboard.writeText(formatFullDeBriefText(debrief.result));
    setFullCopied(true);
    window.setTimeout(() => setFullCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-start md:justify-between md:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <EditableField
              value={debrief.result.meetingTitle}
              onSave={(v) => {
                const t = v.trim() || debrief.result.meetingTitle;
                onUpdateTitle(debrief.id, t);
              }}
              className="font-heading text-xl font-semibold text-zinc-100 md:text-2xl lg:text-3xl"
              placeholder="Meeting title"
              onAfterSave={signalSaved}
              readOnly={readOnly}
            />
            {readOnly ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300">
                {debrief.result.meetingType.replaceAll("_", " ")}
              </span>
            ) : (
              <MeetingTypeBadge
                type={debrief.result.meetingType}
                onOverride={(t) => {
                  onOverrideType(debrief.id, t);
                  signalSaved();
                }}
              />
            )}
          </div>
          {debrief.result.date ? (
            <p className="mt-1 text-sm text-zinc-500">{debrief.result.date}</p>
          ) : null}
        </div>
        <div
          className={
            !readOnly && shareLinks
              ? "grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:flex-wrap md:justify-end md:gap-3"
              : "flex w-full flex-col gap-2 md:w-auto md:flex-row md:flex-wrap md:justify-end md:gap-3"
          }
        >
          {!readOnly && shareLinks ? (
            <div className="min-w-0">
              <ShareButton
                debriefId={shareLinks.debriefId}
                debriefTitle={debrief.meetingTitle}
                hasActiveShares={shareLinks.shares.length > 0}
                activeShares={shareLinks.shares}
                sharesLoading={shareLinks.loading}
                createShare={shareLinks.createShare}
                revokeShare={shareLinks.revokeShare}
              />
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => void copyFull()}
            className="flex min-h-11 w-full items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:border-accent hover:text-white md:w-auto md:px-4"
          >
            {fullCopied ? "Copied" : "Copy Full DeBrief"}
          </button>
        </div>
      </div>

      {readOnly ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-zinc-500">Attendees: </span>
          {debrief.result.attendees.length === 0 ? (
            <span className="text-sm text-zinc-500">—</span>
          ) : (
            debrief.result.attendees.map((a, i) => (
              <span
                key={`${i}-${a}`}
                className="rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-0.5 text-xs text-zinc-300"
              >
                {a}
              </span>
            ))
          )}
        </div>
      ) : (
        <AttendeesLine
          attendees={debrief.result.attendees}
          onSave={(next) => {
            onUpdateAttendees(debrief.id, next);
            signalSaved();
          }}
        />
      )}
    </div>
  );
}
