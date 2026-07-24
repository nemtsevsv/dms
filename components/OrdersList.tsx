"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Order = {
  id: string;
  order_number: string;
  status: string;
  order_date: string;
  currency: string;
  dealers: { id: string; company_name: string } | null;
  order_items: { total: number | null; status: string }[];
};

const statusColors: Record<string, string> = {
  New: "bg-slate-100 text-slate-600",
  Processing: "bg-amber-100 text-amber-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-700",
};

export default function OrdersList({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return orders
      .filter(
        (o) =>
          o.order_number.toLowerCase().includes(search.toLowerCase()) ||
          o.dealers?.company_name.toLowerCase().includes(search.toLowerCase())
      )
      .filter((o) => statusFilter === "all" || o.status === statusFilter);
  }, [orders, search, statusFilter]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          placeholder="Поиск по номеру заказа или дилеру..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
          <option value="all">Все статусы</option>
          <option value="New">New</option>
          <option value="Processing">Processing</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <Link href="/orders/new" className="ml-auto px-3 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800">
          + Новый заказ
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Номер</th>
              <th className="text-left px-4 py-3">Дилер</th>
              <th className="text-left px-4 py-3">Дата</th>
              <th className="text-left px-4 py-3">Статус</th>
              <th className="text-right px-4 py-3">Сумма</th>
              <th className="text-right px-4 py-3">Ждёт счёта</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const total = o.order_items.reduce((s, i) => s + (i.status !== "Cancelled" ? Number(i.total) || 0 : 0), 0);
              const waitingCount = o.order_items.filter((i) => i.status === "Waiting").length;
              return (
                <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/orders/${o.id}`} className="font-medium hover:underline">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{o.dealers?.company_name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{o.order_date}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[o.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {total.toLocaleString("de-DE")} {o.currency}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {waitingCount > 0 ? <span className="text-amber-600 font-medium">{waitingCount}</span> : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  Заказов не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
