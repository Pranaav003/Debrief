"use client";

import { useCallback, useState, type CSSProperties } from "react";
import type { ActionItem } from "@/lib/types";
import { EditableField } from "@/components/EditableField";

const CONFETTI_COUNT = 14;

function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span
      className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-0 w-0"
      aria-hidden
    >
      {Array.from({ length: CONFETTI_COUNT }, (_, i) => (
        <span
          key={i}
          className="debrief-confetti-piece"
          style={
            {
              "--debrief-confetti-angle": `${(360 / CONFETTI_COUNT) * i}deg`,
              "--debrief-confetti-delay": `${i * 25}ms`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

export type ActionItemRowProps = {
  item: ActionItem;
  onToggle: () => void;
  onUpdateTask: (value: string) => void;
  onUpdateOwner: (value: string) => void;
  onUpdateDue: (value: string) => void;
  onDelete: () => void;
  signalSaved: () => void;
  readOnly?: boolean;
};

export function ActionItemRow({
  item,
  onToggle,
  onUpdateTask,
  onUpdateOwner,
  onUpdateDue,
  onDelete,
  signalSaved,
  readOnly = false,
}: ActionItemRowProps) {
  const done = item.completed;
  const [burst, setBurst] = useState(false);

  const handleToggle = useCallback(() => {
    if (!done) {
      setBurst(true);
      window.setTimeout(() => setBurst(false), 900);
    }
    onToggle();
    signalSaved();
  }, [done, onToggle, signalSaved]);

  return (
    <li className="group/ai relative rounded-xl border border-[#2a2a2a] bg-[#141414] p-3 pl-2 md:p-4 md:pl-3">
      {!readOnly ? (
        <button
          type="button"
          aria-label="Remove action item"
          onClick={onDelete}
          className="absolute right-1 top-1 flex min-h-11 min-w-11 items-center justify-center rounded text-lg leading-none text-zinc-600 opacity-0 transition hover:text-zinc-300 group-hover/ai:opacity-100 group-hover/act:opacity-100 md:right-2 md:top-2"
        >
          ×
        </button>
      ) : null}
      <div className="flex gap-3 pr-10 md:flex-row md:pr-8">
        <div className="relative mt-0.5 flex shrink-0 items-start pt-1">
          <ConfettiBurst active={burst} />
          <button
            type="button"
            role="checkbox"
            aria-checked={done}
            onClick={handleToggle}
            disabled={readOnly}
            className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded border transition ${
              done
                ? "border-[#3b82f6] bg-[#3b82f6]"
                : "border-zinc-500 bg-transparent"
            } ${readOnly ? "pointer-events-none opacity-60" : ""}`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center ${
                done ? "text-white" : ""
              }`}
            >
              {done ? (
                <svg
                  className="h-2.5 w-2.5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  aria-hidden
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : null}
            </span>
          </button>
        </div>
        <div className="min-w-0 flex-1 space-y-2 md:space-y-1">
          <EditableField
            value={item.task}
            onSave={onUpdateTask}
            className={
              done
                ? "text-[15px] text-zinc-400 line-through opacity-40"
                : "text-[15px] text-zinc-200"
            }
            placeholder="Task"
            onAfterSave={signalSaved}
            readOnly={readOnly}
          />
          <div className="flex flex-col gap-0.5 text-sm md:flex-row md:items-baseline md:gap-3">
            <div className="text-zinc-500">
              <span className="text-xs font-medium text-zinc-600">Owner: </span>
              <EditableField
                value={item.owner ?? ""}
                onSave={onUpdateOwner}
                className="inline text-[14px] text-zinc-300"
                placeholder="—"
                onAfterSave={signalSaved}
                readOnly={readOnly}
              />
            </div>
            <div className="text-zinc-500">
              <span className="text-xs font-medium text-zinc-600">Due: </span>
              <EditableField
                value={item.due ?? ""}
                onSave={onUpdateDue}
                className="inline text-[14px] text-zinc-300"
                placeholder="—"
                onAfterSave={signalSaved}
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
