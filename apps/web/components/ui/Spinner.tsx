/**
 * Spinner — small rotating indicator for inline/button-level loading states,
 * where a skeleton layout doesn't fit (e.g. "submitting...", a refresh button, a modal action).
 */
const SIZE_MAP = {
  sm: "h-3.5 w-3.5 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-8 w-8 border-[3px]",
} as const;

export function Spinner({
  size = "md",
  className = "",
}: {
  size?: keyof typeof SIZE_MAP;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label="กำลังโหลด"
      className={`inline-block animate-spin rounded-full border-orange-500 border-t-transparent ${SIZE_MAP[size]} ${className}`}
    />
  );
}

/** Full-section centered spinner + label, for a page/panel that's fetching its main data. */
export function LoadingSection({
  label = "กำลังโหลดข้อมูล...",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 text-center ${className}`}>
      <Spinner size="lg" />
      <p className="text-slate-400 font-medium text-sm">{label}</p>
    </div>
  );
}
