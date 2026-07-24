export default function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "default" | "warning" | "danger" | "success";
}) {
  const accentColor = {
    default: "text-slate-900",
    warning: "text-amber-600",
    danger: "text-red-600",
    success: "text-emerald-600",
  }[accent ?? "default"];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${accentColor}`}>{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  );
}
