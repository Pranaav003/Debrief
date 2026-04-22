"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MeetingType } from "@/lib/types";
import {
  BarChart2,
  Lightbulb,
  MessageSquare,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

export type MeetingTypeBadgeProps = {
  type: MeetingType;
  onOverride: (type: MeetingType) => void;
};

const TYPE_META: Record<
  MeetingType,
  {
    label: string;
    color: string;
    Icon: React.ComponentType<{ size?: string | number; className?: string }>;
  }
> = {
  standup: { label: "Standup", color: "#7c3aed", Icon: Zap },
  sales_call: { label: "Sales Call", color: "#16a34a", Icon: TrendingUp },
  brainstorm: { label: "Brainstorm", color: "#ea580c", Icon: Lightbulb },
  one_on_one: { label: "One on One", color: "#0891b2", Icon: Users },
  board_review: { label: "Board Review", color: "#dc2626", Icon: BarChart2 },
  general_sync: { label: "General Sync", color: "#4b5563", Icon: MessageSquare },
};

const ALL_TYPES: MeetingType[] = [
  "standup",
  "sales_call",
  "brainstorm",
  "one_on_one",
  "board_review",
  "general_sync",
];

export function MeetingTypeBadge({ type, onOverride }: MeetingTypeBadgeProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const meta = TYPE_META[type];

  const items = useMemo(
    () => ALL_TYPES.map((t) => ({ type: t, ...TYPE_META[t] })),
    []
  );

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const root = rootRef.current;
      if (!root) return;
      if (root.contains(e.target as Node)) return;
      setOpen(false);
    }
    if (!open) return;
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Detected automatically — click to change"
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-200 transition hover:bg-white/10"
      >
        <meta.Icon size={14} className="opacity-90" />
        <span>{meta.label}</span>
        <span
          className="ml-1 h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: meta.color }}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#141414] shadow-2xl">
          {items.map((it) => (
            <button
              key={it.type}
              type="button"
              onClick={() => {
                onOverride(it.type);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-white/5 ${
                it.type === type ? "bg-white/5" : ""
              }`}
            >
              <it.Icon size={16} className="opacity-80" />
              <span className="flex-1">{it.label}</span>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: it.color }}
                aria-hidden
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

