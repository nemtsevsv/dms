const LEVEL_COLORS = ["bg-red-400", "bg-orange-400", "bg-amber-400", "bg-lime-500", "bg-emerald-500"];

export default function RatingIndicator({ value }: { value: number | null }) {
  if (value === null || Number.isNaN(value)) {
    return <span className="text-xs text-slate-300">—</span>;
  }
  const level = Math.max(1, Math.min(5, Math.round(value)));
  return (
    <div className="flex items-center gap-0.5" title={`Average: ${value.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`w-2.5 h-4 rounded-sm ${n <= level ? LEVEL_COLORS[level - 1] : "bg-slate-100"}`} />
      ))}
    </div>
  );
}
