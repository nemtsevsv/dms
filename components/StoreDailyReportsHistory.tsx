"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";

type Row = {
  date: string;
  staffCount: number | null;
  visitors: number;
  receipts: number;
  salesTotal: number;
  achievementPct: number;
  selfEvaluation: number | null;
};

export default function StoreDailyReportsHistory({ rows, currency }: { rows: Row[]; currency: string }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(
    () => rows.filter((r) => (!from || r.date >= from) && (!to || r.date <= to)),
    [rows, from, to]
  );

  return (
    <div>
      {rows.length > 10 && (
        <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
          <label className="text-slate-500">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm" />
          <label className="text-slate-500">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm" />
          {(from || to) && (
            <button
              onClick={() => {
                setFrom("");
                setTo("");
              }}
              className="text-xs text-slate-400 hover:text-slate-700 underline"
            >
              Clear
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} of {rows.length} days</span>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-[11px] sm:text-sm md:text-base">
          <thead className="bg-slate-50 text-slate-500 text-[10px] sm:text-xs uppercase">
            <tr>
              <th className="text-left px-2 sm:px-4 py-2 sm:py-3">Date</th>
              <th className="text-right px-2 sm:px-4 py-2 sm:py-3">Staff</th>
              <th className="text-right px-2 sm:px-4 py-2 sm:py-3">Visitors</th>
              <th className="text-right px-2 sm:px-4 py-2 sm:py-3">Receipts</th>
              <th className="text-right px-2 sm:px-4 py-2 sm:py-3">Sales ({currency})</th>
              <th className="text-right px-2 sm:px-4 py-2 sm:py-3">Target</th>
              <th className="text-right px-2 sm:px-4 py-2 sm:py-3">Self-eval</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.date} className="border-t border-slate-100">
                <td className="px-2 sm:px-4 py-1.5 sm:py-3 whitespace-nowrap">{format(new Date(r.date), "dd.MM.yyyy")}</td>
                <td className="px-2 sm:px-4 py-1.5 sm:py-3 text-right text-slate-500">{r.staffCount ?? "—"}</td>
                <td className="px-2 sm:px-4 py-1.5 sm:py-3 text-right text-slate-500">{r.visitors}</td>
                <td className="px-2 sm:px-4 py-1.5 sm:py-3 text-right text-slate-500">{r.receipts}</td>
                <td className="px-2 sm:px-4 py-1.5 sm:py-3 text-right">{r.salesTotal.toLocaleString("de-DE")}</td>
                <td className="px-2 sm:px-4 py-1.5 sm:py-3 text-right font-medium">{r.achievementPct}%</td>
                <td className="px-2 sm:px-4 py-1.5 sm:py-3 text-right text-slate-500">{r.selfEvaluation ?? "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  No daily reports in this range
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
