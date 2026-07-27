import Link from "next/link";

type StaleGroup = {
  status: string;
  thresholdDays: number;
  dealers: { id: string; company_name: string; days: number }[];
};

export default function StaleDealersPanel({ groups }: { groups: StaleGroup[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {groups.map((g) => (
        <div key={g.status} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">
            {g.status} — no change for {g.thresholdDays}+ days
          </div>
          <div className={`text-2xl font-semibold mb-2 ${g.dealers.length > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {g.dealers.length}
          </div>
          <ul className="space-y-1">
            {g.dealers.map((d) => (
              <li key={d.id} className="text-xs flex justify-between">
                <Link href={`/dealers/${d.id}`} className="hover:underline text-slate-600 truncate">
                  {d.company_name}
                </Link>
                <span className="text-red-500 shrink-0 ml-2">{d.days}d</span>
              </li>
            ))}
            {g.dealers.length === 0 && <li className="text-xs text-slate-400">All good — nothing overdue</li>}
          </ul>
        </div>
      ))}
    </div>
  );
}
