"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { MessageCircle, X } from "lucide-react";
import type { ActionItem, Decision, Debrief } from "@/lib/types";
import { ChatPanel } from "@/components/ChatPanel";
import { DebriefDetailSkeleton } from "@/components/DebriefDetailSkeleton";
import { DebriefOutput, type DebriefOutputProps } from "@/components/DebriefOutput";
import { ErrorMessage } from "@/components/ErrorMessage";
import type { MeetingType } from "@/lib/types";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { rateLimitUserMessage, retryAfterFromJson } from "@/lib/rateLimitClient";

type DebriefDetailViewProps = {
  debrief: Debrief;
  detailLoading?: boolean;
  detailLoadError?: string | null;
  onRetryLoadDetail?: () => void;
  saveHookError?: string | null;
  onDismissSaveError?: () => void;
  onRetrySave?: () => void;
  updateChatHistory: (id: string, chatHistory: Debrief["chatHistory"]) => Promise<unknown>;
  updateNotes: (notes: string) => void;
  toggleActionItem: (debriefId: string, actionItemId: string) => void;
  updateActionItem: (
    debriefId: string,
    actionItemId: string,
    updates: Partial<ActionItem>
  ) => void;
  updateDecision: (
    debriefId: string,
    decisionId: string,
    updates: Partial<Decision>
  ) => void;
  updateOpenQuestions: (debriefId: string, questions: string[]) => void;
  updateTitle: (debriefId: string, title: string) => void;
  updateMeetingType: (debriefId: string, type: MeetingType) => void;
  shareLinks?: DebriefOutputProps["shareLinks"];
  ensureShareUrlForEmail?: () => Promise<string>;
  updateResultField: (debriefId: string, field: string, value: unknown) => void;
  updateArrayField: (debriefId: string, field: string, index: number, value: string) => void;
  addArrayItem: (debriefId: string, field: string, item: unknown) => void;
  removeArrayItem: (debriefId: string, field: string, index: number) => void;
};

export function DebriefDetailView({
  debrief,
  detailLoading = false,
  detailLoadError = null,
  onRetryLoadDetail,
  saveHookError,
  onDismissSaveError,
  onRetrySave,
  updateChatHistory,
  updateNotes,
  toggleActionItem,
  updateActionItem,
  updateDecision,
  updateOpenQuestions,
  updateTitle,
  updateMeetingType,
  shareLinks,
  ensureShareUrlForEmail,
  updateResultField,
  updateArrayField,
  addArrayItem,
  removeArrayItem,
}: DebriefDetailViewProps) {
  const isMd = useMediaQuery("(min-width: 768px)");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [topPercent, setTopPercent] = useState(75);
  const [loading, setLoading] = useState(false);
  const [chatRateLimitWarning, setChatRateLimitWarning] = useState<string | null>(null);
  const [chatThreadError, setChatThreadError] = useState<{
    lastUserText: string;
  } | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startY: number;
    startPercent: number;
    height: number;
  } | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signalSaved = useCallback(() => {
    setSavedBanner(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSavedBanner(false), 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isMd) setMobileChatOpen(false);
  }, [isMd]);

  const onMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      dragRef.current = {
        startY: e.clientY,
        startPercent: topPercent,
        height: rect.height,
      };
      e.preventDefault();
    },
    [topPercent]
  );

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const d = dragRef.current;
      if (!d || d.height <= 0) return;
      const delta = e.clientY - d.startY;
      const deltaPercent = (delta / d.height) * 100;
      const next = Math.min(80, Math.max(22, d.startPercent + deltaPercent));
      setTopPercent(next);
    }
    function onUp() {
      dragRef.current = null;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  async function handleSend(text: string) {
    setChatRateLimitWarning(null);
    setChatThreadError(null);
    const userMsg = { role: "user" as const, content: text };
    const priorHistory = debrief.chatHistory;
    const last = priorHistory[priorHistory.length - 1];
    const alreadyPending = last?.role === "user" && last.content === text;
    const nextHistory = alreadyPending ? priorHistory : [...priorHistory, userMsg];
    if (!alreadyPending) {
      try {
        await updateChatHistory(debrief.id, nextHistory);
      } catch {
        setChatThreadError({ lastUserText: text });
        return;
      }
    }
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: debrief.transcript,
          messages: nextHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data: unknown = await res.json();
      if (res.status === 429) {
        await updateChatHistory(debrief.id, priorHistory);
        setChatRateLimitWarning(rateLimitUserMessage(retryAfterFromJson(data)));
        return;
      }
      if (
        !res.ok ||
        typeof data !== "object" ||
        data === null ||
        !("reply" in data) ||
        typeof (data as { reply: unknown }).reply !== "string"
      ) {
        setChatThreadError({ lastUserText: text });
        return;
      }
      const reply = (data as { reply: string }).reply;
      await updateChatHistory(debrief.id, [
        ...nextHistory,
        { role: "assistant", content: reply },
      ]);
    } catch {
      setChatThreadError({ lastUserText: text });
    } finally {
      setLoading(false);
    }
  }

  const bottomPercent = 100 - topPercent;

  const showDetailSkeleton =
    detailLoading && String(debrief.transcript ?? "").trim().length === 0;

  const chatErrorProp =
    chatThreadError !== null
      ? {
          message: "Sorry, I couldn't process that. Try again.",
          onRetry: () => {
            const t = chatThreadError.lastUserText;
            setChatThreadError(null);
            void handleSend(t);
          },
        }
      : null;

  const outputEl = showDetailSkeleton ? (
    <DebriefDetailSkeleton />
  ) : (
    <DebriefOutput
      debrief={debrief}
      updateTitle={updateTitle}
      updateMeetingType={updateMeetingType}
      shareLinks={shareLinks}
      ensureShareUrlForEmail={ensureShareUrlForEmail}
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
      saveHookError={saveHookError}
      onDismissSaveError={onDismissSaveError}
      onRetrySave={onRetrySave}
    />
  );

  const hasChatActivity = debrief.chatHistory.length > 0;

  if (!isMd) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-40 pt-4">
          {savedBanner ? (
            <p
              className="pointer-events-none absolute right-4 top-2 z-10 text-xs text-zinc-500 transition-opacity duration-300"
              role="status"
            >
              All changes saved
            </p>
          ) : null}
          {detailLoadError ? (
            <div className="mb-4">
              <ErrorMessage
                type="error"
                message={detailLoadError}
                onRetry={onRetryLoadDetail}
              />
            </div>
          ) : null}
          {outputEl}
        </div>

        <button
          type="button"
          aria-label="Ask about this meeting"
          aria-expanded={mobileChatOpen}
          onClick={() => setMobileChatOpen(true)}
          className="fixed bottom-20 right-4 z-30 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#2563eb] text-white shadow-lg ring-2 ring-blue-400/30 transition hover:bg-blue-600 active:scale-95"
        >
          {hasChatActivity ? (
            <span
              className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#2563eb] bg-red-500"
              aria-hidden
            />
          ) : null}
          <MessageCircle className="h-6 w-6 shrink-0" strokeWidth={2} aria-hidden />
        </button>

        {mobileChatOpen ? (
          <>
            <div
              role="presentation"
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setMobileChatOpen(false)}
            />
            <div
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-2xl border border-[#2a2a2a] border-b-0 bg-[#0a0a0a] shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-chat-title"
            >
              <div className="relative flex shrink-0 flex-col items-center border-b border-[#2a2a2a] px-4 pb-2 pt-3">
                <div className="h-1.5 w-10 rounded-full bg-zinc-600" aria-hidden />
                <h2 id="mobile-chat-title" className="sr-only">
                  Ask about this meeting
                </h2>
                <button
                  type="button"
                  onClick={() => setMobileChatOpen(false)}
                  className="absolute right-2 top-2 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-[#1a1a1a] hover:text-zinc-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex min-h-[50vh] flex-1 flex-col overflow-hidden">
                <ChatPanel
                  messages={debrief.chatHistory}
                  loading={loading}
                  onSend={handleSend}
                  rateLimitWarning={chatRateLimitWarning}
                  chatError={chatErrorProp}
                  variant="sheet"
                />
              </div>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex min-h-0 flex-1 flex-col overflow-hidden transition-opacity duration-150 ease-out"
    >
      <div
        className="relative flex min-h-[140px] min-w-0 flex-col overflow-y-auto px-4 pt-4 md:px-6"
        style={{
          flexGrow: topPercent,
          flexShrink: 1,
          flexBasis: 0,
        }}
      >
        {savedBanner ? (
          <p
            className="pointer-events-none absolute right-4 top-2 z-10 text-xs text-zinc-500 transition-opacity duration-300"
            role="status"
          >
            All changes saved
          </p>
        ) : null}
        {detailLoadError ? (
          <div className="mb-4">
            <ErrorMessage
              type="error"
              message={detailLoadError}
              onRetry={onRetryLoadDetail}
            />
          </div>
        ) : null}
        {outputEl}
      </div>

      <div
        className="group relative z-10 h-3 shrink-0 cursor-row-resize border-y border-[#2a2a2a] bg-[#141414] transition hover:border-[#3b82f6]/50"
        onMouseDown={onMouseDown}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Drag to resize debrief and chat"
      >
        <div className="absolute inset-x-0 top-1/2 mx-auto h-1 w-10 -translate-y-1/2 rounded-full bg-zinc-600 group-hover:bg-[#3b82f6]/80" />
      </div>

      <div
        className="flex min-h-0 min-w-0 flex-col overflow-hidden border-t border-[#2a2a2a]"
        style={{
          flexGrow: bottomPercent,
          flexShrink: 1,
          flexBasis: 0,
        }}
      >
        <ChatPanel
          messages={debrief.chatHistory}
          loading={loading}
          onSend={handleSend}
          rateLimitWarning={chatRateLimitWarning}
          chatError={chatErrorProp}
        />
      </div>
    </div>
  );
}
