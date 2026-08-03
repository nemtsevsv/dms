const STAGES = ["Visitors", "Test-Drives", "Receipts"];
const COLORS = ["bg-blue-400", "bg-amber-400", "bg-emerald-500"];

export default function RetailFunnel({ visitors, testDrives, receipts }: { visitors: number; testDrives: number; receipts: number }) {
  const counts = [visitors, testDrives, receipts];
  const max = Math.max(...counts, 1);

  return (
    <div className="space-y-2">
      {STAGES.map((stage, i) => (
        <div key={stage} className="flex items-center gap-3">
          <div className="w-24 text-xs text-slate-500 shrink-0">{stage}</div>
          <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
            <div
              className={`h-full ${COLORS[i]} flex items-center justify-end pr-2 rounded-full transition-all`}
              style={{ width: `${Math.max((counts[i] / max) * 100, counts[i] > 0 ? 8 : 0)}%` }}
            >
              {counts[i] > 0 && <span className="text-xs text-white font-medium">{counts[i]}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
