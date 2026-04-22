"use client";

import { useMemo } from "react";
import type { SalesCallResult, SalesCallObjection } from "@/lib/types";
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
import { Building2 } from "lucide-react";
import { EditableField } from "@/components/EditableField";

const GREEN = "#16a34a";
const RED = "#dc2626";
const BLUE = "#3b82f6";

const DEALS: SalesCallResult["dealSignal"][] = ["hot", "warm", "cold", "unknown"];

function DealBadge({
  value,
  onCycle,
  readOnly = false,
}: {
  value: SalesCallResult["dealSignal"];
  onCycle: () => void;
  readOnly?: boolean;
}) {
  const meta = useMemo(() => {
    if (value === "hot") return { label: "Hot", bg: "bg-red-500/15", text: "text-red-300" };
    if (value === "warm") return { label: "Warm", bg: "bg-amber-500/15", text: "text-amber-300" };
    if (value === "cold") return { label: "Cold", bg: "bg-cyan-500/15", text: "text-cyan-300" };
    return { label: "Unknown", bg: "bg-zinc-500/15", text: "text-zinc-300" };
  }, [value]);

  return (
    <button
      type="button"
      onClick={onCycle}
      disabled={readOnly}
      className={`inline-flex items-center gap-2 rounded-xl border border-[#2a2a2a] px-4 py-2 text-base font-semibold transition hover:border-white/20 ${meta.bg} ${meta.text}`}
      title="Click to cycle"
    >
      {meta.label}
    </button>
  );
}

export function SalesCallOutput({
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
}: CommonOutputProps & { result: SalesCallResult }) {
  const cycleDeal = () => {
    const idx = Math.max(0, DEALS.indexOf(result.dealSignal));
    const next = DEALS[(idx + 1) % DEALS.length];
    updateResultField(debriefId, "dealSignal", next);
    signalSaved();
  };

  const addObjection = () => {
    const next: SalesCallObjection[] = [
      ...(result.objections ?? []),
      { objection: "", response: null },
    ];
    updateResultField(debriefId, "objections", next);
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
        <SectionHeader title="Prospect" />
        <div className="flex items-center gap-2 text-zinc-300">
          <Building2 size={18} className="text-zinc-500" />
          <div className="flex-1">
            <EditableField
              value={result.prospect}
              onSave={(v) => updateResultField(debriefId, "prospect", v)}
              className="text-lg font-semibold text-zinc-100"
              placeholder="Prospect name"
              onAfterSave={signalSaved}
              readOnly={readOnly}
            />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Deal signal" />
        <DealBadge value={result.dealSignal} onCycle={cycleDeal} readOnly={readOnly} />
      </section>

      <section>
        <SectionHeader
          title="Pain points"
          count={result.painPoints.length}
          action={!readOnly ? (
            <AddItemButton
              label="+ Add"
              onClick={() => {
                addArrayItem(debriefId, "painPoints", "");
                signalSaved();
              }}
              accentColor={GREEN}
            />
          ) : undefined}
        />
        <div className="space-y-3">
          {result.painPoints.map((v, i) => (
            <BorderCard
              key={`pp-${i}`}
              value={v}
              onSave={(next) => updateArrayField(debriefId, "painPoints", i, next)}
              onDelete={() => {
                removeArrayItem(debriefId, "painPoints", i);
                signalSaved();
              }}
              accentColor={RED}
              placeholder="Pain point"
              signalSaved={signalSaved}
              readOnly={readOnly}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Objections"
          count={result.objections.length}
          action={!readOnly ? <AddItemButton label="+ Add" onClick={addObjection} accentColor={GREEN} /> : undefined}
        />
        <div className="space-y-3">
          {result.objections.map((o, i) => (
            <div
              key={`obj-${i}`}
              className="group/obj relative rounded-xl border border-[#2a2a2a] bg-[#141414] p-4"
              style={{ borderLeftWidth: 4, borderLeftColor: GREEN }}
            >
              {!readOnly ? <button
                type="button"
                aria-label="Delete objection"
                onClick={() => {
                  const next = [...result.objections];
                  next.splice(i, 1);
                  updateResultField(debriefId, "objections", next);
                  signalSaved();
                }}
                className="absolute right-2 top-2 rounded px-1.5 text-lg leading-none text-zinc-600 opacity-0 transition hover:text-zinc-300 group-hover/obj:opacity-100"
              >
                ×
              </button> : null}
              <div className="grid gap-3 pr-8 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Objection
                  </p>
                  <div className="mt-1 text-[15px] text-zinc-200">
                    <EditableField
                      as="textarea"
                      value={o.objection}
                      onSave={(v) => {
                        const next = [...result.objections];
                        next[i] = { ...o, objection: v };
                        updateResultField(debriefId, "objections", next);
                      }}
                      placeholder="Objection"
                      onAfterSave={signalSaved}
                      readOnly={readOnly}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Response
                  </p>
                  <div className="mt-1 text-[15px] text-zinc-200">
                    <EditableField
                      as="textarea"
                      value={o.response ?? ""}
                      onSave={(v) => {
                        const next = [...result.objections];
                        next[i] = { ...o, response: v.trim() ? v : null };
                        updateResultField(debriefId, "objections", next);
                      }}
                      placeholder="Response (optional)"
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

      <section>
        <SectionHeader
          title="Next steps"
          count={result.nextSteps.length}
          action={!readOnly ? (
            <AddItemButton
              label="+ Add"
              onClick={() => {
                addArrayItem(debriefId, "nextSteps", "");
                signalSaved();
              }}
              accentColor={GREEN}
            />
          ) : undefined}
        />
        <div className="space-y-3">
          {result.nextSteps.map((v, i) => (
            <BorderCard
              key={`ns-${i}`}
              value={v}
              onSave={(next) => updateArrayField(debriefId, "nextSteps", i, next)}
              onDelete={() => {
                removeArrayItem(debriefId, "nextSteps", i);
                signalSaved();
              }}
              accentColor={BLUE}
              placeholder="Next step"
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

