"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type NotesPanelProps = {
  notes: string;
  updateNotes: (notes: string) => void;
  onAfterSave?: () => void;
};

export function NotesPanel({
  notes,
  updateNotes,
  onAfterSave,
}: NotesPanelProps) {
  const [local, setLocal] = useState(notes);
  const [savedFlash, setSavedFlash] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal(notes);
  }, [notes]);

  const flushSaved = useCallback(() => {
    setSavedFlash(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSavedFlash(false), 1500);
  }, []);

  const scheduleSave = useCallback(
    (next: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateNotes(next);
        debounceRef.current = null;
        flushSaved();
        onAfterSave?.();
      }, 300);
    },
    [updateNotes, flushSaved, onAfterSave]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  return (
    <section className="group/notes mt-8 border-t border-[#2a2a2a] pt-6 md:mt-10 md:pt-8">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Notes
        </h3>
        {savedFlash ? (
          <span className="text-[10px] text-zinc-500">Saved</span>
        ) : null}
      </div>
      <textarea
        value={local}
        onChange={(e) => {
          const next = e.target.value;
          setLocal(next);
          scheduleSave(next);
        }}
        onBlur={() => {
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
          }
          updateNotes(local);
          flushSaved();
          onAfterSave?.();
        }}
        placeholder="Add notes, follow-up thoughts, or next meeting agenda..."
        className="mt-3 min-h-[120px] w-full resize-y rounded border border-transparent bg-transparent px-0 py-1 text-[15px] leading-relaxed text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#3a3a3a] focus:bg-[#141414]/50"
        rows={4}
      />
    </section>
  );
}
