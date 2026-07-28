export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function RecordListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="กำลังโหลด">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="record-item">
          <div className="flex justify-between items-start gap-3">
            <div className="flex gap-[10px] items-start flex-1 min-w-0">
              <Skeleton className="w-8 h-8 rounded-[10px] flex-shrink-0" />
              <div className="flex-1 min-w-0 pt-0.5">
                <Skeleton className="h-3.5 w-2/3 mb-2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-7 w-20 rounded-[8px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 mb-4" aria-busy="true">
      {[0, 1].map((i) => (
        <div key={i} className="stat-card">
          <Skeleton className="h-2.5 w-12 mb-2" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3 px-4">
      <Skeleton className="w-14 h-14 rounded-full" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}
