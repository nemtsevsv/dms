type Row = {
  date: string;
  staffCount: number | null;
  visitors: number;
  salesTotal: number;
  achievementPct: number;
  selfEvaluation: number | null;
};

export default function StoreDailyReportsHistory({ rows, currency }: { rows: Row[]; currency: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3">Date</th>
            <th className="text-right px-4 py-3">Staff</th>
            <th className="text-right px-4 py-3">Visitors</th>
            <th className="text-right px-4 py-3">Sales ({currency})</th>
            <th className="text-right px-4 py-3">Target</th>
            <th className="text-right px-4 py-3">Self-eval</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.date} className="border-t border-slate-100">
              <td className="px-4 py-3">{r.date}</td>
              <td className="px-4 py-3 text-right text-slate-500">{r.staffCount ?? "—"}</td>
              <td className="px-4 py-3 text-right text-slate-500">{r.visitors}</td>
              <td className="px-4 py-3 text-right">{r.salesTotal.toLocaleString("de-DE")}</td>
              <td className="px-4 py-3 text-right font-medium">{r.achievementPct}%</td>
              <td className="px-4 py-3 text-right text-slate-500">{r.selfEvaluation ?? "—"}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-8 text-slate-400">
                No daily reports yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
