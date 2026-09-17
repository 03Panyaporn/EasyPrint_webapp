/**
 * Skeleton — generic animated placeholder block for content that is loading.
 *
 * Usage: <Skeleton className="h-4 w-24" /> for a text-line placeholder,
 * or compose several into a card/list skeleton (see SkeletonCard/SkeletonRow below).
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="กำลังโหลด"
      className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`}
    />
  );
}

/** Skeleton for a shop/service card in a grid (mirrors ShopCard's rough shape). */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden ${className}`}
    >
      <Skeleton className="w-full aspect-[4/3] rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton for a single table/list row (e.g. an order row). */
export function SkeletonRow({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 p-3.5 sm:p-4 ${className}`}>
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full shrink-0" />
    </div>
  );
}

/** Skeleton block for a short block of text lines (e.g. a card body / detail panel). */
export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}
