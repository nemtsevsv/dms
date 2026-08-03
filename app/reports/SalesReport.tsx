"use client";

import { useMemo, useState } from "react";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import { exportToXlsx } from "@/lib/exportXlsx";
import { format } from "date-fns";
import { btnExport } from "@/lib/buttonStyles";
import { Download } from "lucide-react";

type OrderRow = {
  id: string;
  order_number: string;
  order_date: string;
  status: string;
  dealer_name: string;
  country: string;
  manager: string;
  total: number;
  currency: string;
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  status: string;
  dealer_name: string;
  country: string;
  manager: string;
  total: number;
  currency: string;
};

export default function SalesReport({ orders, invoices }: { orders: OrderRow[]; invoices: InvoiceRow[] }) {
  const countries = Array.from(new Set([...orders.map((o) => o.country), ...invoices.map((i) => i.country)].filter(Boolean)));
  const dealerNames = Array.from(new Set([...orders.map((o) => o.dealer_name), ...invoices.map((i) => i.dealer_name)].filter(Boolean)));
  const managers = Array.from(new Set([...orders.map((o) => o.manager), ...invoices.map((i) => i.manager)].filter(Boolean)));

  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [dealerFilter, setDealerFilter] = useState<string[]>([]);
  const [managerFilter, setManagerFilter] = useState<string[]>([]);

  function passes(country: string, dealer: string, manager: string) {
    return (
      (countryFilter.length === 0 || countryFilter.includes(country)) &&
      (dealerFilter.length === 0 || dealerFilter.includes(dealer)) &&
      (managerFilter.length === 0 || managerFilter.includes(manager))
    );
  }

  const filteredOrders = useMemo(
    () => orders.filter((o) => passes(o.country, o.dealer_name, o.manager)),
    [orders, countryFilter, dealerFilter, managerFilter]
  );
  const filteredInvoices = useMemo(
    () => invoices.filter((i) => passes(i.country, i.dealer_name, i.manager)),
    [invoices, countryFilter, dealerFilter, managerFilter]
  );

  const ordersTotal = filteredOrders.reduce((s, o) => (o.status !== "Cancelled" ? s + o.total : s), 0);
  const invoicesTotal = filteredInvoices.reduce((s, i) => (i.status !== "Cancelled" ? s + i.total : s), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <MultiSelectDropdown label="Countries" options={countries} selected={countryFilter} onChange={setCountryFilter} />
        <MultiSelectDropdown label="Dealers" options={dealerNames} selected={dealerFilter} onChange={setDealerFilter} />
        <MultiSelectDropdown label="Managers" options={managers} selected={managerFilter} onChange={setManagerFilter} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Orders Total (filtered)</div>
          <div className="text-2xl font-semibold">{ordersTotal.toLocaleString("de-DE")}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Invoices Total (filtered)</div>
          <div className="text-2xl font-semibold text-emerald-600">{invoicesTotal.toLocaleString("de-DE")}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Orders</h3>
        <button
          onClick={() =>
            exportToXlsx(
              "sales-report-orders.xlsx",
              ["Order Number", "Date", "Status", "Dealer", "Country", "Manager", "Total", "Currency"],
              filteredOrders.map((o) => [o.order_number, o.order_date, o.status, o.dealer_name, o.country, o.manager, o.total, o.currency]),
              "Orders"
            )
          }
          className={btnExport}
        >
          <Download size={14} />
          Export Orders
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm mb-8">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Order</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Dealer</th>
              <th className="text-left px-4 py-3">Country</th>
              <th className="text-left px-4 py-3">Manager</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{o.order_number}</td>
                <td className="px-4 py-3 text-slate-500">{format(new Date(o.order_date), "dd.MM.yyyy")}</td>
                <td className="px-4 py-3">{o.dealer_name}</td>
                <td className="px-4 py-3 text-slate-500">{o.country}</td>
                <td className="px-4 py-3 text-slate-500">{o.manager}</td>
                <td className="px-4 py-3 text-slate-500">{o.status}</td>
                <td className="px-4 py-3 text-right">
                  {o.total.toLocaleString("de-DE")} {o.currency}
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  No orders match these filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Invoices</h3>
        <button
          onClick={() =>
            exportToXlsx(
              "sales-report-invoices.xlsx",
              ["Invoice Number", "Date", "Status", "Dealer", "Country", "Manager", "Total", "Currency"],
              filteredInvoices.map((i) => [i.invoice_number, i.invoice_date, i.status, i.dealer_name, i.country, i.manager, i.total, i.currency]),
              "Invoices"
            )
          }
          className={btnExport}
        >
          <Download size={14} />
          Export Invoices
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Invoice</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Dealer</th>
              <th className="text-left px-4 py-3">Country</th>
              <th className="text-left px-4 py-3">Manager</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((i) => (
              <tr key={i.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{i.invoice_number}</td>
                <td className="px-4 py-3 text-slate-500">{format(new Date(i.invoice_date), "dd.MM.yyyy")}</td>
                <td className="px-4 py-3">{i.dealer_name}</td>
                <td className="px-4 py-3 text-slate-500">{i.country}</td>
                <td className="px-4 py-3 text-slate-500">{i.manager}</td>
                <td className="px-4 py-3 text-slate-500">{i.status}</td>
                <td className="px-4 py-3 text-right">
                  {i.total.toLocaleString("de-DE")} {i.currency}
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  No invoices match these filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
