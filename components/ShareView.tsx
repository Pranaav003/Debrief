"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DebriefOutput } from "@/components/DebriefOutput";
import { ErrorMessage } from "@/components/ErrorMessage";
import { mapSupabaseRowToDebrief, type DebriefRow } from "@/lib/supabaseDebrief";
import type {
  ActionItem,
  Decision,
  Debrief,
  DebriefResult,
  MeetingType,
  ShareRole,
} from "@/lib/types";

type ShareViewProps = {
  debrief: Debrief;
  role: ShareRole;
  shareSlug: string;
};

export function ShareView({ debrief: initialDebrief, role, shareSlug }: ShareViewProps) {
  const [debrief, setDebrief] = useState(initialDebrief);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setDebrief(initialDebrief);
  }, [initialDebrief]);

  const readOnly = role === "viewer";
  const isEditor = role === "editor";

  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      if (!isEditor) return;
      const res = await fetch(
        `/api/debriefs/${initialDebrief.id}?shareSlug=${encodeURIComponent(shareSlug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const raw = (await res.json()) as unknown;
      if (!res.ok) {
        const msg =
          typeof raw === "object" &&
          raw !== null &&
          "error" in raw &&
          typeof (raw as { error: unknown }).error === "string"
            ? (raw as { error: string }).error
            : "Could not save.";
        setSaveError(msg);
        return;
      }
      setSaveError(null);
      const next = mapSupabaseRowToDebrief(raw as DebriefRow);
      if (next) setDebrief(next);
    },
    [initialDebrief.id, isEditor, shareSlug]
  );

  const updateResultField = useCallback(
    async (id: string, field: string, value: unknown) => {
      let payload: Record<string, unknown> | null = null;
      setDebrief((prev) => {
        if (prev.id !== id) return prev;
        const nextResult = { ...(prev.result as object), [field]: value } as DebriefResult;
        payload = { result: nextResult };
        return { ...prev, result: nextResult };
      });
      if (payload) await patch(payload);
    },
    [patch]
  );

  const updateNotes = useCallback(
    async (notes: string) => {
      setDebrief((d) => ({ ...d, notes }));
      await patch({ notes });
    },
    [patch]
  );

  const updateMeetingType = useCallback(
    async (id: string, type: MeetingType) => {
      let payload: Record<string, unknown> | null = null;
      setDebrief((prev) => {
        if (prev.id !== id) return prev;
        const nextResult = { ...prev.result, meetingType: type } as DebriefResult;
        payload = { meetingType: type, result: nextResult };
        return { ...prev, meetingType: type, result: nextResult };
      });
      if (payload) await patch(payload);
    },
    [patch]
  );

  const updateTitle = useCallback(
    async (id: string, title: string) => {
      const t = title.trim();
      let payload: Record<string, unknown> | null = null;
      setDebrief((prev) => {
        if (prev.id !== id) return prev;
        const nextResult = { ...prev.result, meetingTitle: t } as DebriefResult;
        payload = { meetingTitle: t, result: nextResult };
        return { ...prev, meetingTitle: t, result: nextResult };
      });
      if (payload) await patch(payload);
    },
    [patch]
  );

  const signalSaved = useCallback(() => {
    setSaveError(null);
  }, []);

  const updateArrayField = useCallback(
    async (id: string, field: string, index: number, value: string) => {
      let payload: Record<string, unknown> | null = null;
      setDebrief((prev) => {
        if (prev.id !== id) return prev;
        const existing = (prev.result as Record<string, unknown>)[field];
        const arr = Array.isArray(existing) ? [...existing] : [];
        arr[index] = value;
        const nextResult = { ...(prev.result as object), [field]: arr } as unknown as DebriefResult;
        payload = { result: nextResult };
        return { ...prev, result: nextResult };
      });
      if (payload) await patch(payload);
    },
    [patch]
  );

  const addArrayItem = useCallback(
    async (id: string, field: string, item: unknown) => {
      let payload: Record<string, unknown> | null = null;
      setDebrief((prev) => {
        if (prev.id !== id) return prev;
        const existing = (prev.result as Record<string, unknown>)[field];
        const arr = Array.isArray(existing) ? [...existing] : [];
        arr.push(item);
        const nextResult = { ...(prev.result as object), [field]: arr } as unknown as DebriefResult;
        payload = { result: nextResult };
        return { ...prev, result: nextResult };
      });
      if (payload) await patch(payload);
    },
    [patch]
  );

  const removeArrayItem = useCallback(
    async (id: string, field: string, index: number) => {
      let payload: Record<string, unknown> | null = null;
      setDebrief((prev) => {
        if (prev.id !== id) return prev;
        const existing = (prev.result as Record<string, unknown>)[field];
        const arr = Array.isArray(existing) ? [...existing] : [];
        arr.splice(index, 1);
        const nextResult = { ...(prev.result as object), [field]: arr } as unknown as DebriefResult;
        payload = { result: nextResult };
        return { ...prev, result: nextResult };
      });
      if (payload) await patch(payload);
    },
    [patch]
  );

  const toggleActionItem = useCallback(
    async (id: string, actionItemId: string) => {
      let payload: Record<string, unknown> | null = null;
      setDebrief((prev) => {
        if (prev.id !== id) return prev;
        const nextItems = prev.result.actionItems.map((a) =>
          a.id === actionItemId ? { ...a, completed: !a.completed } : a
        );
        const nextResult = { ...prev.result, actionItems: nextItems } as DebriefResult;
        payload = { result: nextResult };
        return { ...prev, result: nextResult };
      });
      if (payload) await patch(payload);
    },
    [patch]
  );

  const updateActionItem = useCallback(
    async (id: string, actionItemId: string, updates: Partial<ActionItem>) => {
      let payload: Record<string, unknown> | null = null;
      setDebrief((prev) => {
        if (prev.id !== id) return prev;
        const nextItems = prev.result.actionItems.map((a) =>
          a.id === actionItemId ? { ...a, ...updates } : a
        );
        const nextResult = { ...prev.result, actionItems: nextItems } as DebriefResult;
        payload = { result: nextResult };
        return { ...prev, result: nextResult };
      });
      if (payload) await patch(payload);
    },
    [patch]
  );

  const updateDecision = useCallback(
    async (id: string, decisionId: string, updates: Partial<Decision>) => {
      let payload: Record<string, unknown> | null = null;
      setDebrief((prev) => {
        if (prev.id !== id) return prev;
        const r = prev.result;
        if (r.meetingType === "general_sync" && "decisions" in r) {
          const next = r.decisions.map((d) => (d.id === decisionId ? { ...d, ...updates } : d));
          const nextResult = { ...r, decisions: next } as DebriefResult;
          payload = { result: nextResult };
          return { ...prev, result: nextResult };
        }
        if (r.meetingType === "board_review" && "strategicDecisions" in r) {
          const next = r.strategicDecisions.map((d) =>
            d.id === decisionId ? { ...d, ...updates } : d
          );
          const nextResult = { ...r, strategicDecisions: next } as DebriefResult;
          payload = { result: nextResult };
          return { ...prev, result: nextResult };
        }
        return prev;
      });
      if (payload) await patch(payload);
    },
    [patch]
  );

  const updateOpenQuestions = useCallback(
    async (id: string, questions: string[]) => {
      await updateResultField(id, "openQuestions", questions);
    },
    [updateResultField]
  );

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-[#1f1f1f] bg-[#0a0a0a]/95 px-4 py-3 backdrop-blur-sm md:px-6">
        <span className="min-w-0 truncate font-heading text-base font-bold text-zinc-100">
          Debrief
        </span>
        <Link
          href="/app"
          className="flex min-h-11 shrink-0 items-center rounded-lg border border-[#2a2a2a] px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-[#141414]"
        >
          Try Debrief
        </Link>
      </header>
      <div className="mx-auto max-w-[760px] px-4 py-6 md:px-6 md:py-10">
        {role === "editor" ? (
          <div
            className="mb-4 border-b border-[#1d4ed8] bg-[#1e2a3a] px-3 py-2.5 text-center text-[13px] text-[#93c5fd]"
            role="status"
          >
            ✏️ You have editor access — changes you make are saved automatically
          </div>
        ) : null}
        {isEditor && saveError ? (
          <div className="mb-4">
            <ErrorMessage type="error" message={saveError} onDismiss={() => setSaveError(null)} />
          </div>
        ) : null}

        <DebriefOutput
          debrief={debrief}
          updateTitle={updateTitle}
          updateMeetingType={updateMeetingType}
          updateNotes={updateNotes}
          signalSaved={signalSaved}
          updateResultField={updateResultField}
          updateArrayField={updateArrayField}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
          toggleActionItem={toggleActionItem}
          updateActionItem={updateActionItem}
          updateDecision={updateDecision}
          updateOpenQuestions={updateOpenQuestions}
          readOnly={readOnly}
        />

        <footer className="mt-12 border-t border-[#2a2a2a] pt-6 text-center text-sm text-zinc-500">
          Made with <span className="text-accent">Debrief</span> {" · "}
          <Link href="/app" className="text-zinc-300 transition hover:text-white">
            Generate your own →
          </Link>
        </footer>
      </div>
    </main>
  );
}
