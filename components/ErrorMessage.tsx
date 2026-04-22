"use client";

import type { CSSProperties } from "react";

type ErrorMessageProps = {
  message: string;
  type?: "error" | "warning" | "info";
  onRetry?: () => void;
  onDismiss?: () => void;
};

const styles: Record<NonNullable<ErrorMessageProps["type"]>, CSSProperties> = {
    error: {
      background: "#2a0f0f",
      border: "1px solid #dc2626",
      color: "#fca5a5",
    },
    warning: {
      background: "#422006",
      border: "1px solid #92400e",
      color: "#fcd34d",
    },
    info: {
      background: "#0f172a",
      border: "1px solid #3b82f6",
      color: "#93c5fd",
    },
  };

export function ErrorMessage({
  message,
  type = "error",
  onRetry,
  onDismiss,
}: ErrorMessageProps) {
  const base: CSSProperties = {
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 14,
    ...styles[type],
  };

  return (
    <div
      className="flex items-start gap-3"
      style={base}
      role={type === "error" ? "alert" : "status"}
    >
      <p className="min-w-0 flex-1 leading-snug">{message}</p>
      <div className="flex shrink-0 items-center gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-current/40 px-2.5 py-1 text-xs font-semibold transition hover:bg-white/10"
          >
            Try again
          </button>
        ) : null}
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded p-1 text-lg leading-none opacity-80 transition hover:bg-white/10 hover:opacity-100"
            aria-label="Dismiss"
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
