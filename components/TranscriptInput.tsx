"use client";

import { forwardRef } from "react";

type TranscriptInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export const TranscriptInput = forwardRef<
  HTMLTextAreaElement,
  TranscriptInputProps
>(function TranscriptInput({ value, onChange, disabled }, ref) {
  return (
    <label className="block w-full">
      <span className="sr-only">Meeting transcript</span>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste your meeting transcript here…"
        rows={14}
        className="min-h-[200px] w-full resize-y rounded-xl border border-[#2a2a2a] bg-[#141414] px-4 py-3 text-[15px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
      />
    </label>
  );
});
