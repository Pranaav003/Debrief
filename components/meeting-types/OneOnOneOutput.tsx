"use client";

import type { OneOnOneResult, OneOnOneCommitment } from "@/lib/types";
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

const CYAN = "#0891b2";
const PURPLE_SOFT = "#a78bfa";
const BLUE = "#3b82f6";

const MOODS: OneOnOneResult["mood"][] = [
  "positive",
  "neutral",
  "tense",
  "unknown",
];

function MoodPills({
  value,
  onChange,
  readOnly = false,
}: {
  value: OneOnOneResult["mood"];
  onChange: (m: OneOnOneResult["mood"]) => void;
  readOnly?: boolean;
}) {
  const meta: Record<
    OneOnOneResult["mood"],
    { label: string; cls: string; active: string }
  > = {
    positive: { label: "Positive", cls: "text-emerald-300/80", active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
    neutral: { label: "Neutral", cls: "text-amber-300/80", active: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
    tense: { label: "Tense", cls: "text-red-300/80", active: "bg-red-500/15 text-red-300 border-red-500/40" },
    unknown: { label: "Unknown", cls: "text-zinc-300/80", active: "bg-white/5 text-zinc-200 border-white/10" },
  };

  return (
    <div className="flex flex-wrap gap-2">
      {MOODS.map((m) => {
        const isActive = m === value;
        const mMeta = meta[m];
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            disabled={readOnly}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
              isActive ? mMeta.active : `border-[#2a2a2a] bg-[#141414] ${mMeta.cls} hover:bg-white/5`
            }`}
          >
            {mMeta.label}
          </button>
        );
      })}
    </div>
  );
}

export function OneOnOneOutput({
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
}: CommonOutputProps & { result: OneOnOneResult }) {
  const addCommitment = () => {
    const next: OneOnOneCommitment[] = [
      ...result.commitmentsMade,
      { commitment: "", owner: "" },
    ];
    updateResultField(debriefId, "commitmentsMade", next);
    signalSaved();
  };

  return (
    <div className="mt-6 space-y-6 md:mt-8 md:space-y-8">
      <SummarySection
        value={result.summary}
        onSave={(v) => updateResultField(debriefId, "summary", v)}
        signalSaved={signalSaved}
        readOnly={readOnly}
      />

      <section className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-5">
        <SectionHeader title="Mood" />
        <MoodPills
          value={result.mood}
          readOnly={readOnly}
          onChange={(m) => {
            updateResultField(debriefId, "mood", m);
            signalSaved();
          }}
        />
      </section>

      <section>
        <SectionHeader
          title="Feedback themes"
          count={result.feedbackThemes.length}
          action={!readOnly ? (
            <AddItemButton
              onClick={() => {
                addArrayItem(debriefId, "feedbackThemes", "");
                signalSaved();
              }}
              accentColor={CYAN}
            />
          ) : undefined}
        />
        <div className="space-y-3">
          {result.feedbackThemes.map((v, i) => (
            <BorderCard
              key={`ft-${i}`}
              value={v}
              onSave={(next) => updateArrayField(debriefId, "feedbackThemes", i, next)}
              onDelete={() => {
                removeArrayItem(debriefId, "feedbackThemes", i);
                signalSaved();
              }}
              accentColor={PURPLE_SOFT}
              placeholder="Theme"
              signalSaved={signalSaved}
              readOnly={readOnly}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Goals discussed"
          count={result.goalsDiscussed.length}
          action={!readOnly ? (
            <AddItemButton
              onClick={() => {
                addArrayItem(debriefId, "goalsDiscussed", "");
                signalSaved();
              }}
              accentColor={CYAN}
            />
          ) : undefined}
        />
        <div className="space-y-3">
          {result.goalsDiscussed.map((v, i) => (
            <BorderCard
              key={`gd-${i}`}
              value={v}
              onSave={(next) => updateArrayField(debriefId, "goalsDiscussed", i, next)}
              onDelete={() => {
                removeArrayItem(debriefId, "goalsDiscussed", i);
                signalSaved();
              }}
              accentColor={BLUE}
              placeholder="Goal"
              signalSaved={signalSaved}
              readOnly={readOnly}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Commitments made"
          count={result.commitmentsMade.length}
          action={!readOnly ? <AddItemButton onClick={addCommitment} accentColor={CYAN} /> : undefined}
        />
        <div className="space-y-3">
          {result.commitmentsMade.map((c, i) => (
            <div
              key={`cm-${i}`}
              className="group/cm relative rounded-xl border border-[#2a2a2a] bg-[#141414] p-4"
              style={{ borderLeftWidth: 4, borderLeftColor: CYAN }}
            >
              {!readOnly ? <button
                type="button"
                aria-label="Delete commitment"
                onClick={() => {
                  const next = [...result.commitmentsMade];
                  next.splice(i, 1);
                  updateResultField(debriefId, "commitmentsMade", next);
                  signalSaved();
                }}
                className="absolute right-2 top-2 rounded px-1.5 text-lg leading-none text-zinc-600 opacity-0 transition hover:text-zinc-300 group-hover/cm:opacity-100"
              >
                ×
              </button> : null}
              <div className="grid gap-3 pr-8 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Commitment
                  </p>
                  <div className="mt-1 text-[15px] text-zinc-200">
                    <EditableField
                      as="textarea"
                      value={c.commitment}
                      onSave={(v) => {
                        const next = [...result.commitmentsMade];
                        next[i] = { ...c, commitment: v };
                        updateResultField(debriefId, "commitmentsMade", next);
                      }}
                      placeholder="Commitment"
                      onAfterSave={signalSaved}
                      readOnly={readOnly}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Owner
                  </p>
                  <div className="mt-1 text-[15px] text-zinc-200">
                    <EditableField
                      value={c.owner}
                      onSave={(v) => {
                        const next = [...result.commitmentsMade];
                        next[i] = { ...c, owner: v };
                        updateResultField(debriefId, "commitmentsMade", next);
                      }}
                      placeholder="Owner"
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

