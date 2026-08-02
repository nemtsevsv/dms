export default function ProgressBar({ label, pct, hint, colorClass }: { label: string; pct: number; hint?: string; colorClass?: string }) {
  const clamped = Math.max(0, Math.min(pct, 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
        <span>{label}</span>
        <span className="font-medium text-slate-700">{Math.round(pct)}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${colorClass ?? "bg-slate-900"}`} style={{ width: `${clamped}%` }} />
      </div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  );
}
