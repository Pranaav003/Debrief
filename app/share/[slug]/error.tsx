"use client";

export default function ShareRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-16 text-zinc-100">
      <div className="mx-auto max-w-md rounded-xl border border-red-500/40 bg-[#2a0f0f] p-6 text-center">
        <h1 className="font-heading text-lg font-semibold text-red-200">Couldn’t load this share</h1>
        <p className="mt-2 text-sm text-red-200/90">{error.message || "Something went wrong."}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-lg border border-red-400/50 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-950/80"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
