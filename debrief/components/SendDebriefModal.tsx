"use client";

import { Mail, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Debrief } from "@/lib/types";
import { retryAfterFromJson } from "@/lib/rateLimitClient";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(s: string): string {
  return s.trim().replace(/^[,;\s]+|[,;\s]+$/g, "");
}

function emailLimitMessage(retryAfterSec: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSec / 60));
  return `Email limit reached. Try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`;
}

function parseInvalidEmailsFromServer(error: string): string[] | null {
  const prefix = "Invalid email addresses:";
  if (!error.startsWith(prefix)) return null;
  return error
    .slice(prefix.length)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type SendDebriefModalProps = {
  open: boolean;
  onClose: () => void;
  debrief: Debrief;
  /** Resolves a public `/share/{slug}` URL (creates a viewer link if needed). */
  ensureShareUrl: () => Promise<string>;
};

export function SendDebriefModal({
  open,
  onClose,
  debrief,
  ensureShareUrl,
}: SendDebriefModalProps) {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [includeShare, setIncludeShare] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorRateLimit, setErrorRateLimit] = useState(false);
  const [invalidHighlight, setInvalidHighlight] = useState<Set<string>>(
    () => new Set()
  );
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setRecipients([]);
    setDraft("");
    setIncludeShare(false);
    setError(null);
    setErrorRateLimit(false);
    setInvalidHighlight(new Set());
    setSuccess(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, debrief.id]);

  const addEmail = useCallback((raw: string) => {
    const e = normalizeEmail(raw);
    if (!e) return;
    if (!EMAIL_RE.test(e)) {
      setError("Invalid email address");
      setInvalidHighlight(new Set([e]));
      return;
    }
    setError(null);
    setInvalidHighlight(new Set());
    setRecipients((prev) => (prev.includes(e) ? prev : [...prev, e]));
    setDraft("");
  }, []);

  const removeEmail = useCallback((email: string) => {
    setRecipients((prev) => prev.filter((x) => x !== email));
    setInvalidHighlight((prev) => {
      const next = new Set(prev);
      next.delete(email);
      return next;
    });
  }, []);

  const onKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === "Enter" || ev.key === "," || ev.key === ";") {
      ev.preventDefault();
      addEmail(draft);
      return;
    }
    if (ev.key === "Backspace" && draft === "" && recipients.length > 0) {
      removeEmail(recipients[recipients.length - 1]!);
    }
  };

  async function handleSend() {
    setInvalidHighlight(new Set());
    const pending = normalizeEmail(draft);
    let list = [...recipients];
    if (pending) {
      if (!EMAIL_RE.test(pending)) {
        setError("Invalid email address");
        setInvalidHighlight(new Set([pending]));
        return;
      }
      if (!list.includes(pending)) list = [...list, pending];
      setDraft("");
    }

    if (list.length === 0) {
      setError("Add at least one recipient email.");
      return;
    }
    if (list.length > 20) {
      setError("Maximum 20 recipients.");
      return;
    }

    const badOnClient = list.filter((e) => !EMAIL_RE.test(e.trim()));
    if (badOnClient.length > 0) {
      setError("Invalid email address");
      setInvalidHighlight(new Set(badOnClient));
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("Couldn't send email. Check your connection.");
      setErrorRateLimit(false);
      return;
    }

    setSending(true);
    setError(null);
    setErrorRateLimit(false);
    setSuccess(false);

    try {
      let shareUrl: string | undefined;
      if (includeShare) {
        try {
          shareUrl = await ensureShareUrl();
        } catch {
          setError("Could not create a share link. Try again.");
          setSending(false);
          return;
        }
      }

      const res = await fetch("/api/send-debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: list,
          meetingTitle: debrief.meetingTitle || debrief.result.meetingTitle,
          notes: debrief.notes ?? "",
          result: debrief.result,
          shareUrl,
        }),
      });

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        if (res.status === 429) {
          setError(emailLimitMessage(retryAfterFromJson(data)));
          setErrorRateLimit(true);
          return;
        }
        const rawMsg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : `Send failed (${res.status})`;

        const serverInvalid = parseInvalidEmailsFromServer(rawMsg);
        if (serverInvalid?.length) {
          setError("Invalid email address");
          setInvalidHighlight(new Set(serverInvalid));
          return;
        }

        if (res.status >= 500) {
          setError(
            "Email service unavailable. Copy the email text and send manually."
          );
          return;
        }

        setError(rawMsg);
        setErrorRateLimit(false);
        return;
      }

      setSuccess(true);
      window.setTimeout(() => {
        onClose();
      }, 1200);
    } catch (e) {
      const offline =
        typeof navigator !== "undefined" && !navigator.onLine;
      const failedFetch =
        e instanceof TypeError ||
        (e instanceof Error &&
          /network|fetch|load failed/i.test(e.message));
      setError(
        offline || failedFetch
          ? "Couldn't send email. Check your connection."
          : e instanceof Error
            ? e.message
            : "Couldn't send email. Check your connection."
      );
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  const highlightToField =
    invalidHighlight.size > 0 &&
    (recipients.some((r) => invalidHighlight.has(r)) ||
      (normalizeEmail(draft) !== "" &&
        invalidHighlight.has(normalizeEmail(draft))));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-debrief-title"
    >
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 mt-auto flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[#2a2a2a] border-b-0 bg-[#141414] shadow-xl md:mt-0 md:rounded-2xl md:border-b">
        <div className="flex shrink-0 justify-center pt-3 md:hidden">
          <div className="h-1.5 w-10 rounded-full bg-zinc-600" aria-hidden />
        </div>
        <div className="relative max-h-[90vh] overflow-y-auto p-6 md:max-h-[min(90vh,720px)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 transition hover:bg-[#1a1a1a] hover:text-zinc-200"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Mail size={18} />
          </div>
          <h2 id="send-debrief-title" className="font-heading text-lg font-semibold text-zinc-100">
            Send debrief
          </h2>
        </div>

        <p className="mb-4 text-sm text-zinc-500">
          Recipients receive a formatted HTML email with the full debrief.
        </p>

        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          To
        </label>
        <div
          className={`flex min-h-[44px] flex-wrap gap-2 rounded-lg border bg-[#0a0a0a] px-2 py-2 focus-within:border-accent/50 ${
            highlightToField ? "border-red-500/60" : "border-[#2a2a2a]"
          }`}
          onClick={() => inputRef.current?.focus()}
        >
          {recipients.map((email) => (
            <span
              key={email}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs ${
                invalidHighlight.has(email)
                  ? "border-red-500 bg-red-950/50 text-red-200"
                  : "border-[#3b82f6]/40 bg-[#1e3a5f]/40 text-zinc-200"
              }`}
            >
              {email}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEmail(email);
                }}
                className="rounded text-zinc-500 hover:text-white"
                aria-label={`Remove ${email}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="email"
            autoComplete="off"
            placeholder={recipients.length === 0 ? "name@company.com" : ""}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (invalidHighlight.size > 0) {
                setInvalidHighlight(new Set());
                setError(null);
              }
            }}
            onKeyDown={onKeyDown}
            onBlur={() => {
              if (normalizeEmail(draft)) addEmail(draft);
            }}
            className="min-w-[140px] flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
          />
        </div>
        {error === "Invalid email address" ? (
          <p className="mt-1 text-xs text-red-400" role="alert">
            Invalid email address
          </p>
        ) : (
          <p className="mt-1 text-xs text-zinc-600">Press Enter, comma, or blur to add each address.</p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-3">
          <div>
            <p className="text-sm font-medium text-zinc-200">Include share link</p>
            <p className="text-xs text-zinc-500">
              Adds an &quot;Open Debrief&quot; button using a read-only share link (created if needed).
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={includeShare}
            onClick={() => setIncludeShare((v) => !v)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150 ease-out ${
              includeShare ? "bg-accent" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-150 ease-out ${
                includeShare ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {error && error !== "Invalid email address" ? (
          <p
            className={`mt-3 text-sm ${errorRateLimit ? "" : "text-red-400"}`}
            role="alert"
            style={
              errorRateLimit
                ? {
                    background: "#422006",
                    border: "1px solid #92400e",
                    color: "#fcd34d",
                    borderRadius: 8,
                    padding: "12px 16px",
                    fontSize: 14,
                  }
                : undefined
            }
          >
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="mt-3 text-sm text-emerald-400" role="status">
            Sent!
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 w-full items-center justify-center rounded-lg border border-[#2a2a2a] px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-[#1a1a1a] sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={() => void handleSend()}
            className="flex min-h-11 w-full items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 sm:w-auto"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
