"use client";

import { LIMIT_CONTACT_EMAIL } from "@/lib/limits";

type DailyLimitMessageProps = {
  current: number;
  limit: number;
  resetsAt: string;
  onDismiss: () => void;
};

function getHoursUntilReset(resetsAt: string): string {
  const diff = new Date(resetsAt).getTime() - Date.now();
  const hours = Math.ceil(diff / (1000 * 60 * 60));
  if (hours <= 1) return "less than an hour away";
  return `${hours} hours away`;
}

export function DailyLimitMessage({
  current,
  limit,
  resetsAt,
  onDismiss,
}: DailyLimitMessageProps) {
  void onDismiss;
  return (
    <div className="mt-6 rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] px-6 py-6 text-center">
      <p className="text-base font-semibold text-white">
        You&apos;ve used all {Math.max(current, limit)} debriefs today.
      </p>
      <p className="mt-2 text-[13px] text-[#6b7280]">
        Resets at midnight <span className="px-1">·</span> {getHoursUntilReset(resetsAt)}
      </p>
      <p className="mt-2 text-[13px] text-[#6b7280]">
        Need more?{" "}
        <a className="text-[#3b82f6] hover:underline" href={`mailto:${LIMIT_CONTACT_EMAIL}`}>
          {LIMIT_CONTACT_EMAIL}
        </a>
      </p>
    </div>
  );
}
