"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";

type ChatPanelProps = {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (text: string) => void | Promise<void>;
  rateLimitWarning?: string | null;
  chatError?: {
    message: string;
    onRetry: () => void;
  } | null;
  /** Tighter layout when shown in mobile bottom sheet */
  variant?: "default" | "sheet";
};

export function ChatPanel({
  messages,
  loading,
  onSend,
  rateLimitWarning,
  chatError,
  variant = "default",
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading, chatError]);

  async function submit() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput("");
    await onSend(trimmed);
  }

  const sheet = variant === "sheet";

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col bg-[#0a0a0a] ${sheet ? "min-h-0" : ""}`}
    >
      {!sheet ? (
        <div className="shrink-0 border-b border-[#2a2a2a] px-4 py-3 md:px-6">
          <h3 className="font-heading text-sm font-semibold text-zinc-300">
            Ask about this meeting
          </h3>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 md:px-6"
      >
        {messages.length === 0 && !loading ? (
          <p className="text-center text-sm text-zinc-500">
            Ask a question about decisions, owners, or next steps.
          </p>
        ) : null}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={`${i}-u`} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#1d4ed8] px-4 py-2.5 text-sm leading-relaxed text-white">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={`${i}-a`} className="flex justify-start">
              <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2.5 text-sm leading-relaxed text-zinc-200">
                {m.content}
              </div>
            </div>
          )
        )}
        {chatError ? (
          <div className="flex justify-start">
            <div
              className="max-w-[90%] space-y-3 rounded-2xl rounded-bl-md border border-red-500/50 bg-[#2a0f0f] px-4 py-3 text-sm leading-relaxed text-red-200"
              role="alert"
            >
              <p>{chatError.message}</p>
              <button
                type="button"
                onClick={chatError.onRetry}
                className="rounded-md border border-red-400/50 px-3 py-1 text-xs font-semibold text-red-100 transition hover:bg-red-950/80"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}
        {loading ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-3 rounded-2xl rounded-bl-md border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-sm text-zinc-500">
              <span className="flex gap-1.5" aria-label="Assistant is typing">
                <span className="debrief-chat-dot h-2 w-2 rounded-full bg-[#3b82f6]" />
                <span className="debrief-chat-dot h-2 w-2 rounded-full bg-[#3b82f6]" />
                <span className="debrief-chat-dot h-2 w-2 rounded-full bg-[#3b82f6]" />
              </span>
              <span>Thinking…</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-[#2a2a2a] p-3 md:px-6 md:pb-4">
        {rateLimitWarning ? (
          <p
            className="mx-auto mb-3 max-w-3xl rounded-lg px-4 py-3 text-sm"
            style={{
              background: "#422006",
              border: "1px solid #92400e",
              color: "#fcd34d",
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 14,
            }}
            role="status"
          >
            {rateLimitWarning}
          </p>
        ) : null}
        <div
          className={`mx-auto flex max-w-3xl items-end gap-2 rounded-full border border-[#2a2a2a] bg-[#141414] py-1.5 pl-4 pr-1.5 ${sheet ? "min-h-[48px]" : ""}`}
        >
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            disabled={loading}
            placeholder="Message…"
            className="max-h-32 min-h-[40px] w-full resize-none bg-transparent py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            disabled={loading || !input.trim()}
            onClick={() => void submit()}
            className="mb-0.5 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
