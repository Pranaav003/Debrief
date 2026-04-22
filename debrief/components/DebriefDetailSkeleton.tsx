"use client";

function Bar({ className }: { className: string }) {
  return <div className={`debrief-skeleton-bar ${className}`} />;
}

function Section() {
  return (
    <div className="space-y-3">
      <Bar className="h-3 w-28" />
      <Bar className="h-3 w-[90%]" />
      <Bar className="h-3 w-[75%]" />
      <Bar className="h-3 w-[60%]" />
    </div>
  );
}

export function DebriefDetailSkeleton() {
  return (
    <div className="space-y-8 px-4 pb-8 pt-4 md:px-6" aria-busy aria-label="Loading debrief">
      <div className="space-y-4">
        <Bar className="h-8 w-[300px] max-w-full" />
        <Bar className="h-3 w-[100px]" />
        <div className="flex flex-wrap gap-2">
          <Bar className="h-6 w-20" />
          <Bar className="h-6 w-24" />
          <Bar className="h-6 w-16" />
        </div>
      </div>
      <Section />
      <Section />
      <Section />
    </div>
  );
}
