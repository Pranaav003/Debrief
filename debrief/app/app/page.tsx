"use client";

import { useEffect, useState } from "react";
import { DebriefDetailView } from "@/components/DebriefDetailView";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { Sidebar } from "@/components/Sidebar";
import { useDebriefs } from "@/lib/useDebriefs";
import type { DebriefResult } from "@/lib/types";

export default function AppPage() {
  const {
    debriefs,
    activeDebrief,
    activeId,
    loading,
    hookError,
    dismissHookError,
    detailLoading,
    detailLoadError,
    clearDetailLoadError,
    addDebrief,
    selectDebrief,
    newDebrief,
    updateNotes,
    updateMeetingType,
    updateResultField,
    activeShares,
    sharesLoading,
    createShare,
    revokeShare,
    updateArrayField,
    addArrayItem,
    removeArrayItem,
    deleteDebrief,
    updateChatHistory,
    refetch,
    ownerToken,
  } = useDebriefs();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [prefillTranscript, setPrefillTranscript] = useState<string | null>(null);
  const [prefillNonce, setPrefillNonce] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefill = sessionStorage.getItem("debrief_prefill");
    if (!prefill) return;
    sessionStorage.removeItem("debrief_prefill");
    setPrefillTranscript(prefill);
    window.setTimeout(() => setPrefillNonce((n) => n + 1), 500);
  }, []);

  async function handleGenerated(transcript: string, result: DebriefResult) {
    await addDebrief({
      meetingTitle: result.meetingTitle,
      meetingType: result.meetingType,
      transcript,
      result,
    });
  }

  return (
    <div className="flex h-[100dvh] min-h-0 w-full overflow-hidden bg-[#0a0a0a] text-zinc-100">
      <Sidebar
        debriefs={debriefs}
        listLoading={loading && debriefs.length === 0}
        activeId={activeId}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        onSelect={(id) => void selectDebrief(id)}
        onNew={newDebrief}
        onClearHistory={() => void refetch()}
        onRename={(id, title) => void updateResultField(id, "meetingTitle", title)}
        onDelete={deleteDebrief}
        onTogglePin={() => {}}
        ownerToken={ownerToken}
      />

      {mobileSidebarOpen ? (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-[#1f1f1f] bg-[#0f0f0f] px-3 md:hidden">
          <button
            type="button"
            aria-label="Open sidebar"
            aria-expanded={mobileSidebarOpen}
            onClick={() => setMobileSidebarOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-[#1a1a1a] hover:text-white"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="min-w-0 flex-1 text-center font-heading text-base font-semibold tracking-tight text-zinc-100">
            Debrief
          </span>
          <button
            type="button"
            onClick={() => {
              newDebrief();
            }}
            className="flex h-11 min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-[#2a2a2a] px-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-[#1a1a1a]"
          >
            New +
          </button>
        </header>

        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#0a0a0a]">
          <div
            key={activeDebrief?.id ?? "generator"}
            className="flex min-h-0 flex-1 flex-col transition-opacity duration-150 ease-out"
          >
            {activeDebrief ? (
              <DebriefDetailView
                debrief={activeDebrief}
                detailLoading={detailLoading}
                detailLoadError={detailLoadError}
                onRetryLoadDetail={() => {
                  clearDetailLoadError();
                  void selectDebrief(activeDebrief.id);
                }}
                saveHookError={hookError}
                onDismissSaveError={dismissHookError}
                onRetrySave={() => void refetch()}
                updateChatHistory={updateChatHistory}
                updateNotes={async (notes) => {
                  await updateNotes(activeDebrief.id, notes);
                }}
                updateTitle={(id, title) => void updateResultField(id, "meetingTitle", title)}
                updateMeetingType={(id, type) => void updateMeetingType(id, type)}
                shareLinks={{
                  debriefId: activeDebrief.id,
                  shares: activeShares,
                  loading: sharesLoading,
                  createShare,
                  revokeShare,
                }}
                ensureShareUrlForEmail={async () => {
                  const origin =
                    typeof window !== "undefined" ? window.location.origin : "";
                  const viewer = activeShares.find((s) => s.role === "viewer");
                  if (viewer) return `${origin}/share/${viewer.slug}`;
                  const s = await createShare(activeDebrief.id, "viewer");
                  return `${origin}/share/${s.slug}`;
                }}
                updateResultField={updateResultField}
                updateArrayField={updateArrayField}
                addArrayItem={addArrayItem}
                removeArrayItem={removeArrayItem}
                toggleActionItem={(id, actionItemId) => {
                  const d = debriefs.find((x) => x.id === id);
                  if (!d) return;
                  const next = d.result.actionItems.map((a) =>
                    a.id === actionItemId ? { ...a, completed: !a.completed } : a
                  );
                  void updateResultField(id, "actionItems", next);
                }}
                updateActionItem={(id, actionItemId, updates) => {
                  const d = debriefs.find((x) => x.id === id);
                  if (!d) return;
                  const next = d.result.actionItems.map((a) =>
                    a.id === actionItemId ? { ...a, ...updates } : a
                  );
                  void updateResultField(id, "actionItems", next);
                }}
                updateDecision={() => {}}
                updateOpenQuestions={(id, qs) => void updateResultField(id, "openQuestions", qs)}
              />
            ) : (
              <GeneratorPanel
                onGenerated={handleGenerated}
                ownerToken={ownerToken}
                prefillTranscript={prefillTranscript}
                prefillNonce={prefillNonce}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
