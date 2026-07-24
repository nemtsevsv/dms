"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Dealer = {
  id: string;
  status: string;
  company_name: string;
  country: string | null;
  city: string | null;
  annual_sales_plan: number | null;
};

const statusColors: Record<string, string> = {
  New: "bg-slate-100 text-slate-600",
  "First Contact": "bg-blue-100 text-blue-700",
  Negotiation: "bg-amber-100 text-amber-700",
  "Contract Signing": "bg-orange-100 text-orange-700",
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-red-100 text-red-700",
};

export default function DealerTable({ dealers }: { dealers: Dealer[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<"company_name" | "annual_sales_plan">("company_name");

  const filtered = useMemo(() => {
    return dealers
      .filter((d) => d.company_name.toLowerCase().includes(search.toLowerCase()))
      .filter((d) => statusFilter === "all" || d.status === statusFilter)
      .sort((a, b) => {
        if (sortKey === "annual_sales_plan") {
          return (b.annual_sales_plan ?? 0) - (a.annual_sales_plan ?? 0);
        }
        return a.company_name.localeCompare(b.company_name);
      });
  }, [dealers, search, statusFilter, sortKey]);

  function exportCsv() {
    const header = ["Company", "Status", "Country", "City", "Annual Plan (EUR)"];
    const rows = filtered.map((d) => [
      d.company_name,
      d.status,
      d.country ?? "",
      d.city ?? "",
      String(d.annual_sales_plan ?? 0),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dealers.csv";
    a.click();
  }

  const statuses = Array.from(new Set(dealers.map((d) => d.status)));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          placeholder="Поиск по названию компании..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="all">Все статусы</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as any)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="company_name">Сортировка: по названию</option>
          <option value="annual_sales_plan">Сортировка: по плану продаж</option>
        </select>
        <button
          onClick={exportCsv}
          className="ml-auto px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
        >
          Экспорт в Excel/CSV
        </button>
        <Link
          href="/dealers/new"
          className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800"
        >
          + Новый дилер
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Компания</th>
              <th className="text-left px-4 py-3">Статус</th>
              <th className="text-left px-4 py-3">Страна</th>
              <th className="text-left px-4 py-3">Город</th>
              <th className="text-right px-4 py-3">Годовой план (EUR)</th>
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
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[d.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{d.country}</td>
                <td className="px-4 py-3 text-slate-500">{d.city}</td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {(d.annual_sales_plan ?? 0).toLocaleString("de-DE")}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  Дилеров не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
