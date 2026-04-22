"use client";

import { useCallback, useRef, useState } from "react";
import { validateAudioFile } from "@/lib/validateAudio";

const ACCEPT =
  "audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,audio/webm,video/mp4,.mp3,.mp4,.m4a,.wav,.webm";

export const WHISPER_MAX_BYTES = 25 * 1024 * 1024;

type UploadZoneProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  sizeError: string | null;
  onSizeError: (message: string | null) => void;
};

export function UploadZone({
  file,
  onFileChange,
  disabled,
  sizeError,
  onSizeError,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateAndSet = useCallback(
    (next: File | null) => {
      onSizeError(null);
      if (!next) {
        onFileChange(null);
        return;
      }
      const validation = validateAudioFile(next);
      if (validation) {
        onSizeError(validation);
        onFileChange(null);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      onFileChange(next);
    },
    [onFileChange, onSizeError]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const dropped = e.dataTransfer.files[0];
      if (dropped) validateAndSet(dropped);
    },
    [disabled, validateAndSet]
  );

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          validateAndSet(f);
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
          }
        }}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          isDragging
            ? "border-accent bg-accent/10"
            : "border-[#2a2a2a] bg-[#141414] hover:border-zinc-600"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span className="font-heading text-lg text-zinc-100">
          Drop audio here
        </span>
        <span className="mt-2 text-sm text-zinc-500">
          or click to choose · MP3, MP4, M4A, WAV, WebM · max 25 MB
        </span>
        {file ? (
          <span className="mt-4 truncate text-sm text-accent">
            {file.name}
          </span>
        ) : null}
      </button>
      {sizeError ? (
        <p className="mt-2 text-sm text-amber-400" role="alert">
          {sizeError}
        </p>
      ) : null}
    </div>
  );
}
