"use client";

type LoadingSpinnerProps = {
  message?: string;
  size?: "sm" | "md" | "lg";
};

const px = { sm: 16, md: 24, lg: 40 } as const;

export function LoadingSpinner({ message, size = "md" }: LoadingSpinnerProps) {
  const s = px[size];
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className="inline-block shrink-0 rounded-full border-2 border-[#3b82f6]/25 border-t-[#3b82f6] motion-safe:animate-spin"
        style={{ width: s, height: s }}
        aria-hidden
      />
      {message ? (
        <p className="text-center text-sm text-zinc-400">{message}</p>
      ) : null}
    </div>
  );
}
