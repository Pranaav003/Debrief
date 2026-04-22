"use client";

function Row({ opacity }: { opacity: number }) {
  return (
    <li className="space-y-2 px-2 py-2" style={{ opacity }}>
      <div className="debrief-skeleton-bar h-3.5 w-[120px]" />
      <div className="debrief-skeleton-bar h-3 w-[60px]" />
    </li>
  );
}

export function DebriefSkeleton() {
  return (
    <ul className="space-y-2" aria-hidden>
      <Row opacity={1} />
      <Row opacity={0.72} />
      <Row opacity={0.48} />
    </ul>
  );
}
