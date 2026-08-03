"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

type StoreMetrics = {
  id: string;
  name: string;
  currency: string;
  trafficToday: number;
  testDrivesToday: number;
  receiptsToday: number;
  conversionPct: number;
  monthSalesEur: number;
  monthPlanEur: number;
  achievementPct: number;
  hasReportToday: boolean;
  topSellers: { email: string; totalEur: number }[];
};

function achievementColor(pct: number) {
  if (pct <= 30) return "text-red-600";
  if (pct <= 50) return "text-orange-600";
  if (pct <= 75) return "text-amber-600";
  return "text-emerald-600";
}

function Widget({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  );
}

export default function RetailDashboardClient({ stores }: { stores: StoreMetrics[] }) {
  const [selectedId, setSelectedId] = useState(stores[0]?.id ?? "");
  const selected = stores.find((s) => s.id === selectedId) ?? stores[0];

  const missingReports = stores.filter((s) => !s.hasReportToday);
  const ranked = [...stores].sort((a, b) => b.achievementPct - a.achievementPct);
  const top = ranked[0];
  const lowest = ranked[ranked.length - 1];

  if (!selected) {
    return <p className="text-sm text-slate-400">No stores set up yet.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm text-slate-500">Store:</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <Widget label="Traffic Today" value={selected.trafficToday} />
        <Widget label="Test-Drives Today" value={selected.testDrivesToday} />
        <Widget label="Receipts Today" value={selected.receiptsToday} />
        <Widget label="Conversion" value={`${Math.round(selected.conversionPct)}%`} />
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Month Sales (EUR)</div>
          <div className="text-2xl font-semibold">{Math.round(selected.monthSalesEur).toLocaleString("de-DE")}</div>
          <div className={`text-xs mt-1 font-medium ${achievementColor(selected.achievementPct)}`}>{Math.round(selected.achievementPct)}% of target</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {top && (
          <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">🏆 Top Store</div>
            <div className="font-semibold">{top.name}</div>
            <div className="text-sm text-slate-500 mt-1">
              {Math.round(top.monthSalesEur).toLocaleString("de-DE")} EUR ·{" "}
              <span className={achievementColor(top.achievementPct)}>{Math.round(top.achievementPct)}%</span>
            </div>
          </div>
        )}
        {lowest && lowest !== top && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-medium text-slate-500 mb-1">Lowest Store</div>
            <div className="font-semibold">{lowest.name}</div>
            <div className="text-sm text-slate-500 mt-1">
              {Math.round(lowest.monthSalesEur).toLocaleString("de-DE")} EUR ·{" "}
              <span className={achievementColor(lowest.achievementPct)}>{Math.round(lowest.achievementPct)}%</span>
            </div>
          </div>
        )}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-2">Reports Missing Today</div>
          {missingReports.length === 0 ? (
            <div className="text-sm text-emerald-600">All stores reported</div>
          ) : (
            <ul className="space-y-1">
              {missingReports.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm text-amber-700">
                  <AlertTriangle size={13} />
                  <Link href={`/stores/${s.id}`} className="hover:underline">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="text-xs font-medium text-slate-500 mb-2">Top Sellers (this month) — {selected.name}</div>
        {selected.topSellers.length === 0 ? (
          <p className="text-sm text-slate-400">No sales recorded yet this month</p>
        ) : (
          <ol className="space-y-1.5">
            {selected.topSellers.map((s, i) => (
              <li key={s.email} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {i + 1}. {s.email}
                </span>
                <span className="font-medium">{Math.round(s.totalEur).toLocaleString("de-DE")} EUR</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
