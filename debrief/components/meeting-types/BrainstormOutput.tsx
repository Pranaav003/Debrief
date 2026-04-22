"use client";

import type { BrainstormResult, BrainstormKilledIdea } from "@/lib/types";
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

const ORANGE = "#ea580c";
const GREEN = "#22c55e";
const RED = "#dc2626";
const YELLOW = "#eab308";

export function BrainstormOutput({
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
}: CommonOutputProps & { result: BrainstormResult }) {
  const addKilled = () => {
    const next: BrainstormKilledIdea[] = [
      ...result.ideasKilled,
      { idea: "", reason: null },
    ];
    updateResultField(debriefId, "ideasKilled", next);
    signalSaved();
  };

  return (
    <div className="mt-6 space-y-6 md:mt-8 md:space-y-8">
      <section className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-5">
        <SectionHeader title="Topic" />
        <EditableField
          value={result.topic}
          onSave={(v) => updateResultField(debriefId, "topic", v)}
          className="text-xl font-semibold text-zinc-100"
          placeholder="Brainstorm topic"
          onAfterSave={signalSaved}
          readOnly={readOnly}
        />
      </section>

      <SummarySection
        value={result.summary}
        onSave={(v) => updateResultField(debriefId, "summary", v)}
        signalSaved={signalSaved}
        readOnly={readOnly}
      />

      <section>
        <SectionHeader
          title="Ideas generated"
          count={result.ideasGenerated.length}
          action={!readOnly ? (
            <AddItemButton
              label="+ Add"
              onClick={() => {
                addArrayItem(debriefId, "ideasGenerated", "");
                signalSaved();
              }}
              accentColor={ORANGE}
            />
          ) : undefined}
        />
        <div className="grid gap-3 md:grid-cols-2">
          {result.ideasGenerated.map((v, i) => (
            <BorderCard
              key={`ig-${i}`}
              value={v}
              onSave={(next) =>
                updateArrayField(debriefId, "ideasGenerated", i, next)
              }
              onDelete={() => {
                removeArrayItem(debriefId, "ideasGenerated", i);
                signalSaved();
              }}
              accentColor="#3f3f46"
              placeholder="Idea"
              signalSaved={signalSaved}
              readOnly={readOnly}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Shortlisted ideas"
          count={result.ideasShortlisted.length}
          action={!readOnly ? (
            <AddItemButton
              label="+ Add"
              onClick={() => {
                addArrayItem(debriefId, "ideasShortlisted", "");
                signalSaved();
              }}
              accentColor={ORANGE}
            />
          ) : undefined}
        />
        <div className="space-y-3">
          {result.ideasShortlisted.map((v, i) => (
            <BorderCard
              key={`is-${i}`}
              value={v}
              onSave={(next) =>
                updateArrayField(debriefId, "ideasShortlisted", i, next)
              }
              onDelete={() => {
                removeArrayItem(debriefId, "ideasShortlisted", i);
                signalSaved();
              }}
              accentColor={GREEN}
              placeholder="Shortlisted idea"
              signalSaved={signalSaved}
              readOnly={readOnly}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Killed ideas"
          count={result.ideasKilled.length}
          action={!readOnly ? <AddItemButton label="+ Add" onClick={addKilled} accentColor={ORANGE} /> : undefined}
        />
        <div className="space-y-3">
          {result.ideasKilled.map((k, i) => (
            <BorderCard
              key={`killed-${i}`}
              value={k.idea}
              onSave={(v) => {
                const next = [...result.ideasKilled];
                next[i] = { ...k, idea: v };
                updateResultField(debriefId, "ideasKilled", next);
                signalSaved();
              }}
              onDelete={() => {
                const next = [...result.ideasKilled];
                next.splice(i, 1);
                updateResultField(debriefId, "ideasKilled", next);
                signalSaved();
              }}
              accentColor={RED}
              placeholder="Idea"
              subValue={k.reason ?? ""}
              onSubSave={(v) => {
                const next = [...result.ideasKilled];
                next[i] = { ...k, reason: v.trim() ? v : null };
                updateResultField(debriefId, "ideasKilled", next);
                signalSaved();
              }}
              subPlaceholder="Reason (optional)"
              signalSaved={signalSaved}
              readOnly={readOnly}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Open threads"
          count={result.openThreads.length}
          action={!readOnly ? (
            <AddItemButton
              label="+ Add"
              onClick={() => {
                addArrayItem(debriefId, "openThreads", "");
                signalSaved();
              }}
              accentColor={ORANGE}
            />
          ) : undefined}
        />
        <div className="space-y-3">
          {result.openThreads.map((v, i) => (
            <BorderCard
              key={`ot-${i}`}
              value={v}
              onSave={(next) => updateArrayField(debriefId, "openThreads", i, next)}
              onDelete={() => {
                removeArrayItem(debriefId, "openThreads", i);
                signalSaved();
              }}
              accentColor={YELLOW}
              placeholder="Open thread"
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

