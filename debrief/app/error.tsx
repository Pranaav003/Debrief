"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4 text-zinc-100">
      <div className="max-w-md rounded-xl border border-[#2a2a2a] bg-[#141414] p-8 text-center">
        <h1 className="font-heading text-lg font-semibold text-zinc-100">Something went wrong</h1>
        <p className="mt-2 text-sm text-zinc-400">{error.message || "An unexpected error occurred."}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
