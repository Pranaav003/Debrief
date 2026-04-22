"use client";

import { useState } from "react";
import type { ActionItem, Decision, DebriefResult, MeetingType } from "@/lib/types";
import { ActionItemRow } from "@/components/ActionItemRow";
import { EditableField } from "@/components/EditableField";
import { generateShortId } from "@/lib/ids";

export type CommonOutputProps = {
  debriefId: string;
  result: DebriefResult;
  signalSaved: () => void;
  // generic helpers
  updateResultField: (debriefId: string, field: string, value: unknown) => void;
  updateArrayField: (
    debriefId: string,
    field: string,
    index: number,
    value: string
  ) => void;
  addArrayItem: (debriefId: string, field: string, item: unknown) => void;
  removeArrayItem: (debriefId: string, field: string, index: number) => void;
  // action items
  toggleActionItem: (debriefId: string, actionItemId: string) => void;
  updateActionItem: (
    debriefId: string,
    actionItemId: string,
    updates: Partial<ActionItem>
  ) => void;
  // decisions (used by general_sync + board_review)
  updateDecision: (
    debriefId: string,
    decisionId: string,
    updates: Partial<Decision>
  ) => void;
  updateOpenQuestions: (debriefId: string, questions: string[]) => void;
  /** Opens Send Debrief modal (lifted to DebriefOutput). */
  onOpenSendDebrief?: () => void;
  readOnly?: boolean;
};

export function SummarySection({
  value,
  onSave,
  signalSaved,
  readOnly = false,
}: {
  value: string;
  onSave: (v: string) => void;
  signalSaved: () => void;
  readOnly?: boolean;
}) {
  return (
    <section className="group/sum rounded-xl border border-l-4 border-[#2a2a2a] border-l-zinc-600 bg-[#141414] p-3 md:p-5">
      <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Summary
      </h3>
      <div className="mt-3 text-[15px] leading-relaxed text-zinc-300">
        <EditableField
          as="textarea"
          value={value}
          onSave={onSave}
          placeholder="No summary provided."
          onAfterSave={signalSaved}
          readOnly={readOnly}
        />
      </div>
    </section>
  );
}

export function FollowUpEmailSection({
  subject,
  body,
  onSaveSubject,
  onSaveBody,
  signalSaved,
  onOpenSendDebrief,
  readOnly = false,
}: {
  subject: string;
  body: string;
  onSaveSubject: (v: string) => void;
  onSaveBody: (v: string) => void;
  signalSaved: () => void;
  onOpenSendDebrief?: () => void;
  readOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    const text = `Subject: ${subject}\n\n${body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="group/email rounded-xl border border-[#2a2a2a] bg-[#141414] p-3 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Follow-up email
        </h3>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end md:w-auto md:flex-row">
          {!readOnly && onOpenSendDebrief ? (
            <button
              type="button"
              onClick={onOpenSendDebrief}
              className="flex min-h-11 w-full items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#141414] px-4 py-2 text-sm font-semibold text-zinc-200 transition duration-150 ease-out hover:border-accent hover:text-white md:w-auto"
            >
              Send Debrief
            </button>
          ) : null}
          {!readOnly ? (
            <button
              type="button"
              onClick={() => void copyEmail()}
              className="flex min-h-11 w-full items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 md:w-auto"
            >
              {copied ? "Copied" : "Copy email"}
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-3 text-zinc-900 shadow-sm md:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Subject
        </p>
        <div className="mt-1 text-sm font-medium text-zinc-900">
          <EditableField
            value={subject}
            onSave={onSaveSubject}
            className="text-sm font-medium text-zinc-900"
            editClassName="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm font-medium text-zinc-900 outline-none ring-0 focus:border-zinc-400"
            placeholder="Subject"
            onAfterSave={signalSaved}
            readOnly={readOnly}
          />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Body
        </p>
        <div className="mt-2 font-mono text-sm leading-relaxed text-zinc-800">
          <EditableField
            as="textarea"
            value={body}
            onSave={onSaveBody}
            className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-800"
            editClassName="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-800 outline-none ring-0 focus:border-zinc-400"
            placeholder="Email body"
            onAfterSave={signalSaved}
            readOnly={readOnly}
          />
        </div>
      </div>
    </section>
  );
}

export function ActionItemsSection({
  debriefId,
  actionItems,
  signalSaved,
  toggleActionItem,
  updateActionItem,
  addBlank,
  onDelete,
  readOnly = false,
}: {
  debriefId: string;
  actionItems: ActionItem[];
  signalSaved: () => void;
  toggleActionItem: (debriefId: string, actionItemId: string) => void;
  updateActionItem: (
    debriefId: string,
    actionItemId: string,
    updates: Partial<ActionItem>
  ) => void;
  addBlank: () => void;
  onDelete: (actionItemId: string) => void;
  readOnly?: boolean;
}) {
  const completed = actionItems.filter((x) => x.completed).length;
  const total = actionItems.length;

  return (
    <section className="group/act">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Action items
        </h3>
        {total > 0 ? (
          <div className="flex min-w-0 max-w-full flex-1 items-center justify-end gap-2 sm:max-w-[240px]">
            <span className="shrink-0 text-xs tabular-nums text-zinc-500">
              {completed} / {total}
            </span>
            <div
              className="h-1.5 min-w-[72px] flex-1 overflow-hidden rounded-full bg-zinc-800"
              role="progressbar"
              aria-valuenow={completed}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`${completed} of ${total} action items completed`}
            >
              <div
                className="h-full rounded-full bg-[#3b82f6] transition-[width] duration-300 ease-out"
                style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm text-zinc-600">No action items yet.</p>
          {!readOnly ? (
            <button
              type="button"
              onClick={addBlank}
              className="mt-3 text-sm text-zinc-500 transition hover:text-zinc-300"
            >
              + Add one
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-4">
          {actionItems.map((a) => (
            <ActionItemRow
              key={a.id}
              item={a}
              onToggle={() => toggleActionItem(debriefId, a.id)}
              onUpdateTask={(v) => updateActionItem(debriefId, a.id, { task: v })}
              onUpdateOwner={(v) =>
                updateActionItem(debriefId, a.id, {
                  owner: v.trim() ? v.trim() : null,
                })
              }
              onUpdateDue={(v) =>
                updateActionItem(debriefId, a.id, {
                  due: v.trim() ? v.trim() : null,
                })
              }
              onDelete={() => onDelete(a.id)}
              signalSaved={signalSaved}
              readOnly={readOnly}
            />
          ))}
        </ul>
      )}

      {total > 0 && !readOnly ? (
        <button
          type="button"
          onClick={addBlank}
          className="mt-3 text-sm text-zinc-500 opacity-0 transition hover:text-zinc-300 group-hover/act:opacity-100"
        >
          + Add Action Item
        </button>
      ) : null}
    </section>
  );
}

export function newActionItem(): ActionItem {
  return {
    id: generateShortId(),
    task: "",
    owner: null,
    due: null,
    completed: false,
  };
}

export function safeType(t: unknown): MeetingType {
  return t === "standup" ||
    t === "sales_call" ||
    t === "brainstorm" ||
    t === "one_on_one" ||
    t === "board_review" ||
    t === "general_sync"
    ? t
    : "general_sync";
}

