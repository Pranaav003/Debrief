"use client";

import { EditableField } from "@/components/EditableField";

export type SectionHeaderProps = {
  title: string;
  count?: number;
  action?: React.ReactNode;
};

export function SectionHeader({ title, count, action }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-400">
          {title}
        </h3>
        {typeof count === "number" ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-300">
            {count}
          </span>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export type AddItemButtonProps = {
  label?: string;
  onClick: () => void;
  accentColor?: string;
};

export function AddItemButton({
  label = "+ Add",
  onClick,
  accentColor,
}: AddItemButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm text-zinc-500 transition hover:text-zinc-300"
      style={accentColor ? ({ color: accentColor } as React.CSSProperties) : undefined}
    >
      {label}
    </button>
  );
}

export type BorderCardProps = {
  value: string;
  onSave: (value: string) => void;
  onDelete: () => void;
  accentColor: string;
  placeholder?: string;
  as?: "text" | "textarea";
  subValue?: string;
  onSubSave?: (value: string) => void;
  subPlaceholder?: string;
  signalSaved?: () => void;
  readOnly?: boolean;
};

export function BorderCard({
  value,
  onSave,
  onDelete,
  accentColor,
  placeholder,
  as = "text",
  subValue,
  onSubSave,
  subPlaceholder,
  signalSaved,
  readOnly = false,
}: BorderCardProps) {
  return (
    <div
      className="group/card relative rounded-xl border border-[#2a2a2a] bg-[#141414] p-4"
      style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
    >
      {!readOnly ? (
        <button
          type="button"
          aria-label="Delete"
          onClick={onDelete}
          className="absolute right-2 top-2 rounded px-1.5 text-lg leading-none text-zinc-600 opacity-0 transition hover:text-zinc-300 group-hover/card:opacity-100"
        >
          ×
        </button>
      ) : null}
      <div className={`${readOnly ? "" : "pr-8"} text-[15px] leading-relaxed text-zinc-200`}>
        <EditableField
          as={as}
          value={value}
          onSave={onSave}
          placeholder={placeholder}
          onAfterSave={signalSaved}
          readOnly={readOnly}
        />
      </div>
      {typeof subValue === "string" && onSubSave ? (
        <div className={`mt-2 ${readOnly ? "" : "pr-8"} text-xs text-zinc-500`}>
          <EditableField
            value={subValue}
            onSave={onSubSave}
            placeholder={subPlaceholder}
            onAfterSave={signalSaved}
            readOnly={readOnly}
          />
        </div>
      ) : null}
    </div>
  );
}

