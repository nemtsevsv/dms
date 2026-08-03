"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ColumnFilterHeader from "./ColumnFilterHeader";
import { format } from "date-fns";
import { btnPrimary } from "@/lib/buttonStyles";

type Order = {
  id: string;
  order_number: string;
  status: string;
  order_date: string;
  currency: string;
  dealers: { id: string; company_name: string } | null;
  computedTotal: number;
  waitingCount: number;
};

const statusColors: Record<string, string> = {
  New: "bg-slate-100 text-slate-600",
  Processing: "bg-amber-100 text-amber-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-700",
};

function applyFilter(value: string, selected: string[]) {
  return selected.length === 0 || (selected.length === 1 && selected[0] === "__none__" ? false : selected.includes(value));
}

export default function OrdersList({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dealerFilter, setDealerFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<"order_date" | "computedTotal">("order_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const dealerOptions = Array.from(new Set(orders.map((o) => o.dealers?.company_name ?? "—")));
  const statusOptions = Array.from(new Set(orders.map((o) => o.status)));

  const filtered = useMemo(() => {
    return orders
      .filter(
        (o) =>
          o.order_number.toLowerCase().includes(search.toLowerCase()) ||
          o.dealers?.company_name.toLowerCase().includes(search.toLowerCase())
      )
      .filter((o) => !dateFrom || o.order_date >= dateFrom)
      .filter((o) => !dateTo || o.order_date <= dateTo)
      .filter((o) => applyFilter(o.dealers?.company_name ?? "—", dealerFilter))
      .filter((o) => applyFilter(o.status, statusFilter))
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey === "computedTotal") return (a.computedTotal - b.computedTotal) * dir;
        return a.order_date.localeCompare(b.order_date) * dir;
      });
  }, [orders, search, dateFrom, dateTo, dealerFilter, statusFilter, sortKey, sortDir]);

  function handleSort(key: "order_date" | "computedTotal", dir: "asc" | "desc") {
    setSortKey(key);
    setSortDir(dir);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          placeholder="Search by order number or dealer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          <span className="text-slate-400 text-sm">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <Link href="/orders/new" className={btnPrimary + " sm:ml-auto"}>
          + New Order
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Number</th>
              <th className="text-left px-4 py-3">
                <ColumnFilterHeader label="Dealer" options={dealerOptions} selected={dealerFilter} onChange={setDealerFilter} />
              </th>
              <th className="text-left px-4 py-3">
                <ColumnFilterHeader
                  label="Date"
                  options={[]}
                  selected={[]}
                  onChange={() => {}}
                  sortDir={sortKey === "order_date" ? sortDir : null}
                  onSort={(dir) => handleSort("order_date", dir)}
                />
              </th>
              <th className="text-left px-4 py-3">
                <ColumnFilterHeader label="Status" options={statusOptions} selected={statusFilter} onChange={setStatusFilter} />
              </th>
              <th className="text-right px-4 py-3">
                <ColumnFilterHeader
                  label="Total"
                  options={[]}
                  selected={[]}
                  onChange={() => {}}
                  align="right"
                  sortDir={sortKey === "computedTotal" ? sortDir : null}
                  onSort={(dir) => handleSort("computedTotal", dir)}
                />
              </th>
              <th className="text-right px-4 py-3">Waiting</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/orders/${o.id}`} className="font-medium hover:underline">
                    {o.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3">{o.dealers?.company_name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">{format(new Date(o.order_date), "dd.MM.yyyy")}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[o.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {o.computedTotal.toLocaleString("de-DE")} {o.currency}
                </td>
                <td className="px-4 py-3 text-right">
                  {o.waitingCount > 0 ? <span className="text-amber-600 font-medium">{o.waitingCount}</span> : <span className="text-slate-300">—</span>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
