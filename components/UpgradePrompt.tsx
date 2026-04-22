"use client";

import { Zap } from "lucide-react";
import type { LimitKind } from "@/lib/limitErrors";

export type UpgradePromptProps = {
  type: LimitKind;
  current: number;
  limit: number;
  onUpgrade: () => void;
};

const HEADLINE: Record<LimitKind, string> = {
  debriefs: "debriefs",
  chatMessages: "chat messages",
  shareLinks: "share links",
  emailSends: "email sends",
};

export function UpgradePrompt({ type, current, limit, onUpgrade }: UpgradePromptProps) {
  const label = HEADLINE[type];

  return (
    <div
      className="rounded-xl border px-4 py-4"
      style={{
        background: "#1a1a0a",
        borderColor: "#ca8a04",
      }}
      role="status"
    >
      <div className="flex gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "#ca8a0420", color: "#facc15" }}
          aria-hidden
        >
          <Zap className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-100">
            You&apos;ve used {current}/{limit} {label} this month
          </p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            Upgrade to Debrief Pro for unlimited debriefs, chat, sharing, and more.
          </p>
          <button
            type="button"
            onClick={() => void onUpgrade()}
            className="mt-4 flex min-h-11 w-full items-center justify-center rounded-lg text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: "#ca8a04" }}
          >
            $12/month → Upgrade to Pro
          </button>
          <p className="mt-2 text-center text-xs text-zinc-500">
            Cancel anytime · Instant access
          </p>
        </div>
      </div>
    </div>
  );
}
