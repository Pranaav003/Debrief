"use client";

import type { StandupResult, StandupBlocker } from "@/lib/types";
import type { CommonOutputProps } from "@/components/meeting-types/shared";
import {
  SummarySection,
  FollowUpEmailSection,
  newActionItem,
} from "@/components/meeting-types/shared";
import { ActionItemsSection } from "@/components/meeting-types/shared";
import {
  AddItemButton,
  BorderCard,
  SectionHeader,
} from "@/components/meeting-types/SectionCard";
import { generateShortId } from "@/lib/ids";

const PURPLE = "#7c3aed";
const GREEN = "#22c55e";
const BLUE = "#3b82f6";
const RED = "#dc2626";
const GRAY = "#52525b";

export function StandupOutput({
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
}: CommonOutputProps & { result: StandupResult }) {
  const addBlocker = () => {
    const next: StandupBlocker[] = [
      ...result.blockers,
      { id: generateShortId(), blocker: "", owner: null },
    ];
    updateResultField(debriefId, "blockers", next);
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

      <section>
        <SectionHeader
          title="Shipped"
          count={result.shipped.length}
          action={!readOnly ? (
            <AddItemButton
              label="+ Add"
              onClick={() => {
                addArrayItem(debriefId, "shipped", "");
                signalSaved();
              }}
              accentColor={PURPLE}
            />
          ) : undefined}
        />
        <div className="space-y-3">
          {result.shipped.map((v, i) => (
            <BorderCard
              key={`shipped-${i}`}
              value={v}
              onSave={(next) => updateArrayField(debriefId, "shipped", i, next)}
              onDelete={() => {
                removeArrayItem(debriefId, "shipped", i);
                signalSaved();
              }}
              accentColor={GREEN}
              placeholder="Shipped item"
              signalSaved={signalSaved}
              readOnly={readOnly}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="In progress"
          count={result.inProgress.length}
          action={!readOnly ? (
            <AddItemButton
              label="+ Add"
              onClick={() => {
                addArrayItem(debriefId, "inProgress", "");
                signalSaved();
              }}
              accentColor={PURPLE}
            />
          ) : undefined}
        />
        <div className="space-y-3">
          {result.inProgress.map((v, i) => (
            <BorderCard
              key={`ip-${i}`}
              value={v}
              onSave={(next) =>
                updateArrayField(debriefId, "inProgress", i, next)
              }
              onDelete={() => {
                removeArrayItem(debriefId, "inProgress", i);
                signalSaved();
              }}
              accentColor={BLUE}
              placeholder="In progress"
              signalSaved={signalSaved}
              readOnly={readOnly}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Blockers"
          count={result.blockers.length}
          action={!readOnly ? <AddItemButton label="+ Add" onClick={addBlocker} accentColor={PURPLE} /> : undefined}
        />
        <div className="space-y-3">
          {result.blockers.map((b, i) => (
            <BorderCard
              key={b.id}
              value={b.blocker}
              onSave={(next) => {
                const nextBlockers = [...result.blockers];
                nextBlockers[i] = { ...b, blocker: next };
                updateResultField(debriefId, "blockers", nextBlockers);
                signalSaved();
              }}
              onDelete={() => {
                updateResultField(
                  debriefId,
                  "blockers",
                  result.blockers.filter((x) => x.id !== b.id)
                );
                signalSaved();
              }}
              accentColor={RED}
              placeholder="Blocker"
              subValue={b.owner ?? ""}
              onSubSave={(v) => {
                const nextBlockers = [...result.blockers];
                nextBlockers[i] = { ...b, owner: v.trim() ? v.trim() : null };
                updateResultField(debriefId, "blockers", nextBlockers);
                signalSaved();
              }}
              subPlaceholder="Owner"
              signalSaved={signalSaved}
              readOnly={readOnly}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Up next"
          count={result.upNext.length}
          action={!readOnly ? (
            <AddItemButton
              label="+ Add"
              onClick={() => {
                addArrayItem(debriefId, "upNext", "");
                signalSaved();
              }}
              accentColor={PURPLE}
            />
          ) : undefined}
        />
        <div className="space-y-3">
          {result.upNext.map((v, i) => (
            <BorderCard
              key={`up-${i}`}
              value={v}
              onSave={(next) => updateArrayField(debriefId, "upNext", i, next)}
              onDelete={() => {
                removeArrayItem(debriefId, "upNext", i);
                signalSaved();
              }}
              accentColor={GRAY}
              placeholder="Up next"
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

