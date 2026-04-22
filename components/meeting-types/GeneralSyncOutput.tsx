"use client";

import type { GeneralSyncResult } from "@/lib/types";
import type { CommonOutputProps } from "@/components/meeting-types/shared";
import {
  SummarySection,
  FollowUpEmailSection,
  newActionItem,
} from "@/components/meeting-types/shared";
import { ActionItemsSection } from "@/components/meeting-types/shared";
import { EditableField } from "@/components/EditableField";
import { generateShortId } from "@/lib/ids";

export function GeneralSyncOutput(props: CommonOutputProps & { result: GeneralSyncResult }) {
  const {
    debriefId,
    result,
    signalSaved,
    updateResultField,
    updateOpenQuestions,
    updateDecision,
    toggleActionItem,
    updateActionItem,
    onOpenSendDebrief,
    readOnly = false,
  } = props;

  return (
    <div className="mt-6 space-y-6 md:mt-8 md:space-y-8">
      <SummarySection
        value={result.summary}
        onSave={(v) => updateResultField(debriefId, "summary", v)}
        signalSaved={signalSaved}
        readOnly={readOnly}
      />

      <section className="group/dec">
        <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Decisions made
        </h3>
        <ul className="space-y-3">
          {result.decisions.length === 0 ? (
            <li className="text-sm text-zinc-500">No decisions listed.</li>
          ) : (
            result.decisions.map((d) => (
              <li
                key={d.id}
                className="group/dcard relative rounded-xl border border-l-4 border-[#2a2a2a] border-l-emerald-500/90 bg-[#141414] p-3 md:p-4"
              >
                {!readOnly ? <button
                  type="button"
                  aria-label="Remove decision"
                  onClick={() => {
                    updateResultField(
                      debriefId,
                      "decisions",
                      result.decisions.filter((x) => x.id !== d.id)
                    );
                    signalSaved();
                  }}
                  className="absolute right-2 top-2 rounded px-1.5 text-lg leading-none text-zinc-600 opacity-0 transition hover:text-zinc-300 group-hover/dcard:opacity-100 group-hover/dec:opacity-100"
                >
                  ×
                </button> : null}
                <div className="pr-8">
                  <EditableField
                    as="textarea"
                    value={d.decision}
                    onSave={(v) => updateDecision(debriefId, d.id, { decision: v })}
                    className="text-[15px] text-zinc-200"
                    placeholder="Decision"
                    onAfterSave={signalSaved}
                    readOnly={readOnly}
                  />
                </div>
                <div className="mt-2">
                  <EditableField
                    value={d.owner ?? ""}
                    onSave={(v) =>
                      updateDecision(debriefId, d.id, {
                        owner: v.trim() ? v.trim() : null,
                      })
                    }
                    className="inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300"
                    placeholder="Owner"
                    onAfterSave={signalSaved}
                    readOnly={readOnly}
                  />
                </div>
              </li>
            ))
          )}
        </ul>
        {!readOnly ? <button
          type="button"
          onClick={() => {
            updateResultField(debriefId, "decisions", [
              ...result.decisions,
              { id: generateShortId(), decision: "", owner: null },
            ]);
            signalSaved();
          }}
          className="mt-3 text-sm text-zinc-500 opacity-0 transition hover:text-zinc-300 group-hover/dec:opacity-100"
        >
          + Add Decision
        </button> : null}
      </section>

      <ActionItemsSection
        debriefId={debriefId}
        actionItems={result.actionItems}
        signalSaved={signalSaved}
        toggleActionItem={toggleActionItem}
        updateActionItem={updateActionItem}
        addBlank={() => {
          updateResultField(debriefId, "actionItems", [...result.actionItems, newActionItem()]);
          signalSaved();
        }}
        onDelete={(actionItemId) => {
          updateResultField(
            debriefId,
            "actionItems",
            result.actionItems.filter((x) => x.id !== actionItemId)
          );
          signalSaved();
        }}
        readOnly={readOnly}
      />

      <section className="group/oq">
        <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Open questions
        </h3>
        <ul className="space-y-3">
          {result.openQuestions.length === 0 ? (
            <li className="text-sm text-zinc-500">None noted.</li>
          ) : (
            result.openQuestions.map((q, i) => (
              <li
                key={`openq-${i}`}
                className="group/q relative rounded-xl border border-l-4 border-[#2a2a2a] border-l-amber-500/90 bg-[#141414] px-4 py-3"
              >
                {!readOnly ? <button
                  type="button"
                  aria-label="Remove question"
                  onClick={() => {
                    updateOpenQuestions(
                      debriefId,
                      result.openQuestions.filter((_, j) => j !== i)
                    );
                    signalSaved();
                  }}
                  className="absolute right-2 top-2 rounded px-1.5 text-lg leading-none text-zinc-600 opacity-0 transition hover:text-zinc-300 group-hover/q:opacity-100 group-hover/oq:opacity-100"
                >
                  ×
                </button> : null}
                <div className="pr-8">
                  <EditableField
                    value={q}
                    onSave={(v) => {
                      const next = [...result.openQuestions];
                      next[i] = v;
                      updateOpenQuestions(debriefId, next);
                    }}
                    className="text-[15px] text-zinc-200"
                    placeholder="Question"
                    onAfterSave={signalSaved}
                    readOnly={readOnly}
                  />
                </div>
              </li>
            ))
          )}
        </ul>
        {!readOnly ? <button
          type="button"
          onClick={() => {
            updateOpenQuestions(debriefId, [...result.openQuestions, ""]);
            signalSaved();
          }}
          className="mt-3 text-sm text-zinc-500 opacity-0 transition hover:text-zinc-300 group-hover/oq:opacity-100"
        >
          + Add Question
        </button> : null}
      </section>

      <FollowUpEmailSection
        subject={result.followUpEmail.subject}
        body={result.followUpEmail.body}
        onSaveSubject={(v) =>
          updateResultField(debriefId, "followUpEmail", { ...result.followUpEmail, subject: v })
        }
        onSaveBody={(v) =>
          updateResultField(debriefId, "followUpEmail", { ...result.followUpEmail, body: v })
        }
        signalSaved={signalSaved}
        onOpenSendDebrief={onOpenSendDebrief}
        readOnly={readOnly}
      />
    </div>
  );
}

