"use client";

import type { BoardReviewResult, Decision } from "@/lib/types";
import type { CommonOutputProps } from "@/components/meeting-types/shared";
import {
  FollowUpEmailSection,
  SummarySection,
  newActionItem,
} from "@/components/meeting-types/shared";
import { ActionItemsSection } from "@/components/meeting-types/shared";
import {
  AddItemButton,
  BorderCard,
  SectionHeader,
} from "@/components/meeting-types/SectionCard";
import { EditableField } from "@/components/EditableField";
import { generateShortId } from "@/lib/ids";

const RED = "#dc2626";
const ORANGE = "#ea580c";

export function BoardReviewOutput({
  debriefId,
  result,
  signalSaved,
  updateResultField,
  updateArrayField,
  addArrayItem,
  removeArrayItem,
  toggleActionItem,
  updateActionItem,
  onOpenSendDebrief,
  readOnly = false,
}: CommonOutputProps & { result: BoardReviewResult }) {
  return (
    <div className="mt-6 space-y-6 md:mt-8 md:space-y-8">
      <SummarySection
        value={result.summary}
        onSave={(v) => updateResultField(debriefId, "summary", v)}
        signalSaved={signalSaved}
        readOnly={readOnly}
      />

      <section>
        <SectionHeader
          title="Metrics discussed"
          count={result.metricsDiscussed.length}
          action={!readOnly ? (
            <AddItemButton
              label="+ Add"
              onClick={() => {
                addArrayItem(debriefId, "metricsDiscussed", { metric: "", status: "" });
                signalSaved();
              }}
              accentColor={RED}
            />
          ) : undefined}
        />
        <div className="grid gap-3 md:grid-cols-2">
          {result.metricsDiscussed.map((m, i) => (
            <div
              key={`met-${i}`}
              className="group/met relative rounded-xl border border-[#2a2a2a] bg-[#141414] p-4"
              style={{ borderLeftWidth: 4, borderLeftColor: RED }}
            >
              {!readOnly ? <button
                type="button"
                aria-label="Delete metric"
                onClick={() => {
                  const next = [...result.metricsDiscussed];
                  next.splice(i, 1);
                  updateResultField(debriefId, "metricsDiscussed", next);
                  signalSaved();
                }}
                className="absolute right-2 top-2 rounded px-1.5 text-lg leading-none text-zinc-600 opacity-0 transition hover:text-zinc-300 group-hover/met:opacity-100"
              >
                ×
              </button> : null}
              <div className="grid gap-3 pr-8 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Metric
                  </p>
                  <div className="mt-1 text-[15px] text-zinc-200">
                    <EditableField
                      value={m.metric}
                      onSave={(v) => {
                        const next = [...result.metricsDiscussed];
                        next[i] = { ...m, metric: v };
                        updateResultField(debriefId, "metricsDiscussed", next);
                      }}
                      placeholder="Metric"
                      onAfterSave={signalSaved}
                      readOnly={readOnly}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Status
                  </p>
                  <div className="mt-1 text-[15px] text-zinc-200">
                    <EditableField
                      value={m.status}
                      onSave={(v) => {
                        const next = [...result.metricsDiscussed];
                        next[i] = { ...m, status: v };
                        updateResultField(debriefId, "metricsDiscussed", next);
                      }}
                      placeholder="Status"
                      onAfterSave={signalSaved}
                      readOnly={readOnly}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="group/dec">
        <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Strategic decisions
        </h3>
        <ul className="space-y-3">
          {result.strategicDecisions.length === 0 ? (
            <li className="text-sm text-zinc-500">No decisions listed.</li>
          ) : (
            result.strategicDecisions.map((d) => (
              <li
                key={d.id}
                className="group/dcard relative rounded-xl border border-l-4 border-[#2a2a2a] border-l-red-500/80 bg-[#141414] p-4"
              >
                {!readOnly ? <button
                  type="button"
                  aria-label="Remove decision"
                  onClick={() => {
                    updateResultField(
                      debriefId,
                      "strategicDecisions",
                      result.strategicDecisions.filter((x) => x.id !== d.id)
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
                    onSave={(v) => {
                      const next = result.strategicDecisions.map((x) =>
                        x.id === d.id ? { ...x, decision: v } : x
                      );
                      updateResultField(debriefId, "strategicDecisions", next);
                      signalSaved();
                    }}
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
                      (() => {
                        const next = result.strategicDecisions.map((x) =>
                          x.id === d.id
                            ? { ...x, owner: v.trim() ? v.trim() : null }
                            : x
                        );
                        updateResultField(debriefId, "strategicDecisions", next);
                        signalSaved();
                      })()
                    }
                    className="inline-block rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-300"
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
            updateResultField(debriefId, "strategicDecisions", [
              ...result.strategicDecisions,
              { id: generateShortId(), decision: "", owner: null },
            ] as Decision[]);
            signalSaved();
          }}
          className="mt-3 text-sm text-zinc-500 opacity-0 transition hover:text-zinc-300 group-hover/dec:opacity-100"
        >
          + Add Decision
        </button> : null}
      </section>

      <section>
        <SectionHeader
          title="Risks raised"
          count={result.risksRaised.length}
          action={!readOnly ? (
            <AddItemButton
              label="+ Add"
              onClick={() => {
                addArrayItem(debriefId, "risksRaised", "");
                signalSaved();
              }}
              accentColor={RED}
            />
          ) : undefined}
        />
        <div className="space-y-3">
          {result.risksRaised.map((v, i) => (
            <BorderCard
              key={`risk-${i}`}
              value={v}
              onSave={(next) => updateArrayField(debriefId, "risksRaised", i, next)}
              onDelete={() => {
                removeArrayItem(debriefId, "risksRaised", i);
                signalSaved();
              }}
              accentColor={ORANGE}
              placeholder="Risk"
              signalSaved={signalSaved}
              readOnly={readOnly}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Concerns"
          count={result.concerns.length}
          action={!readOnly ? (
            <AddItemButton
              label="+ Add"
              onClick={() => {
                addArrayItem(debriefId, "concerns", "");
                signalSaved();
              }}
              accentColor={RED}
            />
          ) : undefined}
        />
        <div className="space-y-3">
          {result.concerns.map((v, i) => (
            <BorderCard
              key={`con-${i}`}
              value={v}
              onSave={(next) => updateArrayField(debriefId, "concerns", i, next)}
              onDelete={() => {
                removeArrayItem(debriefId, "concerns", i);
                signalSaved();
              }}
              accentColor={RED}
              placeholder="Concern"
              signalSaved={signalSaved}
              readOnly={readOnly}
            />
          ))}
        </div>
      </section>

      <ActionItemsSection
        debriefId={debriefId}
        actionItems={result.actionItems}
        signalSaved={signalSaved}
        toggleActionItem={toggleActionItem}
        updateActionItem={updateActionItem}
        addBlank={() => {
          updateResultField(debriefId, "actionItems", [
            ...result.actionItems,
            newActionItem(),
          ]);
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

      <FollowUpEmailSection
        subject={result.followUpEmail.subject}
        body={result.followUpEmail.body}
        onSaveSubject={(v) =>
          updateResultField(debriefId, "followUpEmail", {
            ...result.followUpEmail,
            subject: v,
          })
        }
        onSaveBody={(v) =>
          updateResultField(debriefId, "followUpEmail", {
            ...result.followUpEmail,
            body: v,
          })
        }
        signalSaved={signalSaved}
        onOpenSendDebrief={onOpenSendDebrief}
        readOnly={readOnly}
      />
    </div>
  );
}

