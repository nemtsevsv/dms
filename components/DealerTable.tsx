"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { dealerStatusBadge } from "@/lib/statusColors";
import { achievementColorClass } from "@/lib/achievementColor";

type Dealer = {
  id: string;
  status: string;
  company_name: string;
  country: string | null;
  city: string | null;
  annual_sales_plan: number | null;
  actual_sales: number;
};

export default function DealerTable({ dealers }: { dealers: Dealer[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [sortKey, setSortKey] = useState<"company_name" | "annual_sales_plan" | "actual_sales" | "achievement">("company_name");

  const countries = Array.from(new Set(dealers.map((d) => d.country).filter(Boolean))) as string[];
  const statuses = Array.from(new Set(dealers.map((d) => d.status)));

  function achievementPct(d: Dealer) {
    return d.annual_sales_plan ? Math.round((d.actual_sales / d.annual_sales_plan) * 100) : 0;
  }

  const filtered = useMemo(() => {
    return dealers
      .filter((d) => d.company_name.toLowerCase().includes(search.toLowerCase()))
      .filter((d) => statusFilter === "all" || d.status === statusFilter)
      .filter((d) => countryFilter === "all" || d.country === countryFilter)
      .sort((a, b) => {
        if (sortKey === "annual_sales_plan") return (b.annual_sales_plan ?? 0) - (a.annual_sales_plan ?? 0);
        if (sortKey === "actual_sales") return (b.actual_sales ?? 0) - (a.actual_sales ?? 0);
        if (sortKey === "achievement") return achievementPct(b) - achievementPct(a);
        return a.company_name.localeCompare(b.company_name);
      });
  }, [dealers, search, statusFilter, countryFilter, sortKey]);

  function exportCsv() {
    const header = ["Company", "Status", "Country", "City", "Annual Plan (EUR)", "Actual Sales (EUR)", "Target Achievement (%)"];
    const rows = filtered.map((d) => [
      d.company_name,
      d.status,
      d.country ?? "",
      d.city ?? "",
      String(d.annual_sales_plan ?? 0),
      String(d.actual_sales ?? 0),
      String(achievementPct(d)),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dealers.csv";
    a.click();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          placeholder="Search by company name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
          <option value="all">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
          <option value="all">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
          <option value="company_name">Sort by: name</option>
          <option value="annual_sales_plan">Sort by: sales plan</option>
          <option value="actual_sales">Sort by: actual sales</option>
          <option value="achievement">Sort by: achievement</option>
        </select>
        <button onClick={exportCsv} className="sm:ml-auto px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
          Export to Excel/CSV
        </button>
        <Link href="/dealers/new" className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800">
          + New Dealer
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[850px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Company</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Country</th>
              <th className="text-left px-4 py-3">City</th>
              <th className="text-right px-4 py-3">Annual Plan (EUR)</th>
              <th className="text-right px-4 py-3">Actual Sales (EUR)</th>
              <th className="text-right px-4 py-3">Target Achievement</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/dealers/${d.id}`} className="font-medium hover:underline">
                    {d.company_name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${dealerStatusBadge(d.status)}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{d.country}</td>
                <td className="px-4 py-3 text-slate-500">{d.city}</td>
                <td className="px-4 py-3 text-right text-slate-700">{(d.annual_sales_plan ?? 0).toLocaleString("de-DE")}</td>
                <td className="px-4 py-3 text-right text-slate-700">{(d.actual_sales ?? 0).toLocaleString("de-DE")}</td>
                <td className={`px-4 py-3 text-right font-semibold ${achievementColorClass(achievementPct(d))}`}>{achievementPct(d)}%</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  No dealers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
