const COLORS = ["bg-blue-400", "bg-sky-500", "bg-emerald-500", "bg-violet-500"];

export default function MarketingFunnelWidget({ title, stages }: { title: string; stages: { label: string; value: number }[] }) {
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-full">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{title}</h3>
      <div className="space-y-1.5">
        {stages.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-20 text-[11px] text-slate-500 shrink-0 truncate">{s.label}</div>
            <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
              <div
                className={`h-full ${COLORS[i % COLORS.length]} flex items-center justify-end pr-2 rounded-full transition-all`}
                style={{ width: `${Math.max((s.value / max) * 100, s.value > 0 ? 10 : 0)}%` }}
              >
                {s.value > 0 && <span className="text-[10px] text-white font-medium">{Math.round(s.value).toLocaleString("de-DE")}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
