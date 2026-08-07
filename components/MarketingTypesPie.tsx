const COLORS = ["#E4002B", "#2563EB", "#F59E0B", "#10B981", "#8B5CF6", "#0EA5E9", "#EC4899", "#64748B"];

export default function MarketingTypesPie({ data }: { data: { type: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  let cursor = 0;
  const stops: string[] = [];
  data.forEach((d, i) => {
    const pct = total > 0 ? (d.count / total) * 100 : 0;
    const color = COLORS[i % COLORS.length];
    stops.push(`${color} ${cursor}% ${cursor + pct}%`);
    cursor += pct;
  });
  const gradient = stops.length > 0 ? `conic-gradient(${stops.join(", ")})` : "#e5e7eb";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-full">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">By Type</h3>
      {total === 0 ? (
        <p className="text-sm text-slate-400">No activities this month</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full shrink-0" style={{ background: gradient }} />
          <div className="space-y-1 min-w-0">
            {data.map((d, i) => (
              <div key={d.type} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-slate-600 truncate">{d.type}</span>
                <span className="text-slate-400 shrink-0">
                  {d.count} · {total > 0 ? Math.round((d.count / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
