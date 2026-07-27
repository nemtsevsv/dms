import { dealerStatusHex } from "@/lib/statusColors";

export default function AvgTimeInStatus({ data }: { data: { status: string; avgDays: number; count: number }[] }) {
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.status} className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dealerStatusHex(d.status) }} />
            {d.status}
          </span>
          <span className="text-slate-500">
            <span className="font-semibold text-slate-800">{d.avgDays}</span> days avg
            <span className="text-slate-400"> · {d.count} dealer{d.count === 1 ? "" : "s"}</span>
          </span>
        </div>
      ))}
      {data.length === 0 && <p className="text-sm text-slate-400">No data yet</p>}
    </div>
  );
}
