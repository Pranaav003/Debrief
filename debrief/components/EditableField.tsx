"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

function IconPencil({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

export type EditableFieldProps = {
  value: string;
  onSave: (value: string) => void;
  as?: "text" | "textarea";
  className?: string;
  editClassName?: string;
  placeholder?: string;
  onAfterSave?: () => void;
  readOnly?: boolean;
};

export function EditableField({
  value,
  onSave,
  as = "text",
  className = "",
  editClassName,
  placeholder,
  onAfterSave,
  readOnly = false,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [savedFlash, setSavedFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useLayoutEffect(() => {
    if (!editing || as !== "textarea") return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [editing, as, draft]);

  const flashSaved = useCallback(() => {
    setSavedFlash(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSavedFlash(false), 1500);
  }, []);

  const commit = useCallback(() => {
    const next = draft;
    onSave(next);
    setEditing(false);
    flashSaved();
    onAfterSave?.();
  }, [draft, onSave, onAfterSave, flashSaved]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  function startEdit() {
    setDraft(value);
    setEditing(true);
    requestAnimationFrame(() => {
      if (as === "textarea") {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      } else {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        el.select();
      }
    });
  }

  if (readOnly) {
    return (
      <div className={className}>
        {value || <span className="text-zinc-500">{placeholder ?? "—"}</span>}
      </div>
    );
  }

  if (editing) {
    const defaultEditClass =
      "w-full rounded border border-[#3a3a3a] bg-[#2a2a2a] px-2 py-1.5 text-inherit outline-none ring-0 focus:border-[#4a4a4a]";
    const editClass = editClassName ?? defaultEditClass;

    if (as === "textarea") {
      return (
        <textarea
          ref={textareaRef}
          value={draft}
          placeholder={placeholder}
          rows={1}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit()}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              commit();
            }
          }}
          className={`${editClass} resize-none overflow-hidden ${className}`}
        />
      );
    }

    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            commit();
          }
        }}
        className={`${editClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`group/ef relative cursor-text ${className}`}
      onClick={() => startEdit()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          startEdit();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <span
        className="pointer-events-none absolute right-0 top-0 z-[1] text-zinc-600 opacity-0 transition-opacity group-hover/ef:opacity-60"
        aria-hidden
      >
        <IconPencil />
      </span>
      <div className="pr-6 whitespace-pre-wrap break-words">
        {value || (
          <span className="text-zinc-500">{placeholder ?? "—"}</span>
        )}
      </div>
      {savedFlash ? (
        <span className="pointer-events-none absolute -right-1 top-full mt-0.5 text-[10px] text-zinc-500">
          Saved
        </span>
      ) : null}
    </div>
  );
}
