"use client";

import { useSubscription } from "@/lib/useSubscription";

function barColor(used: number, limit: number): string {
  if (!Number.isFinite(limit) || limit <= 0) return "#22c55e";
  const pct = used / limit;
  if (pct >= 0.8) return "#dc2626";
  if (pct >= 0.6) return "#ca8a04";
  return "#3b82f6";
}

export function UsageBar() {
  const { isPro, loading, usage, limits, upgrade } = useSubscription();

  if (loading) {
    return (
      <div className="rounded-lg px-2 py-2 text-xs text-zinc-600">Loading plan…</div>
    );
  }

  if (isPro) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-400">
        Pro Plan
      </div>
    );
  }

  const limit = limits.debriefs_per_month;
  const used = usage.debriefs;
  const max = Number.isFinite(limit) ? limit : 1;
  const fillPct = Math.min(100, (used / max) * 100);
  const color = barColor(used, max);

  return (
    <div className="space-y-2 px-1">
      <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
        <span>
          Debriefs{" "}
          <span className="text-zinc-500">
            {used}/{max} used
          </span>
        </span>
        <button
          type="button"
          onClick={() => void upgrade().catch(() => {})}
          className="shrink-0 font-semibold text-amber-500/90 transition hover:text-amber-400"
        >
          Upgrade →
        </button>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1f1f1f]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${fillPct}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
