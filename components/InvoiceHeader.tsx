"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";
import { marginColorClass, marginBgClass } from "@/lib/marginColor";

const STATUSES = ["Draft", "Sent", "Paid", "Cancelled"];

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

const amountFormatter = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function parseLocaleNumber(s: string): number {
  return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
}

export default function InvoiceHeader({
  invoice,
  invoiceTotal,
  dealerCountryCode,
}: {
  invoice: any;
  invoiceTotal: number;
  dealerCountryCode: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    invoice_number: invoice.invoice_number,
    invoice_date: invoice.invoice_date,
    status: invoice.status,
    lc_ag_invoice_number: invoice.lc_ag_invoice_number ?? "",
    lc_ag_invoice_date: invoice.lc_ag_invoice_date ?? "",
    lc_ag_invoice_total: invoice.lc_ag_invoice_total ?? "",
    logistics_de_mn: invoice.logistics_de_mn ?? "",
    logistics_mn_xx: invoice.logistics_mn_xx ?? "",
  });
  const [lcAgTotalText, setLcAgTotalText] = useState(amountFormatter.format(invoice.lc_ag_invoice_total ?? 0));
  const [logisticsDeMnText, setLogisticsDeMnText] = useState(amountFormatter.format(invoice.logistics_de_mn ?? 0));
  const [logisticsMnXxText, setLogisticsMnXxText] = useState(amountFormatter.format(invoice.logistics_mn_xx ?? 0));
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  function update(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save() {
    setSaving(true);
    setJustSaved(false);
    const lcAgTotalVal = parseLocaleNumber(lcAgTotalText);
    const logisticsDeMnVal = parseLocaleNumber(logisticsDeMnText);
    const logisticsMnXxVal = parseLocaleNumber(logisticsMnXxText);
    await supabase
      .from("invoices")
      .update({
        invoice_number: form.invoice_number,
        invoice_date: form.invoice_date,
        status: form.status,
        lc_ag_invoice_number: form.lc_ag_invoice_number || null,
        lc_ag_invoice_date: form.lc_ag_invoice_date || null,
        lc_ag_invoice_total: lcAgTotalVal,
        logistics_de_mn: logisticsDeMnVal,
        logistics_mn_xx: logisticsMnXxVal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);
    setSaving(false);
    setJustSaved(true);
    router.refresh();
    setTimeout(() => setJustSaved(false), 2500);
  }

  const lcAgTotal = parseLocaleNumber(lcAgTotalText);
  const logisticsDeMn = parseLocaleNumber(logisticsDeMnText);
  const logisticsMnXx = parseLocaleNumber(logisticsMnXxText);
  const financialResult = round2(invoiceTotal - lcAgTotal - logisticsDeMn - logisticsMnXx);
  const marginPct = invoiceTotal > 0 ? round2((financialResult / invoiceTotal) * 100) : 0;

  const inputCls = "px-3 py-2 border border-slate-300 rounded-lg text-sm w-full bg-white";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5 items-stretch">
        {/* Left panel — what we invoice the dealer. Same padding/structure
            as the Purchase panel on the right so every row lines up. */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Invoice to Dealer</h3>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Invoice Number</label>
              <input className={inputCls} value={form.invoice_number} onChange={(e) => update("invoice_number", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Invoice Date</label>
                <input type="date" className={inputCls} value={form.invoice_date} onChange={(e) => update("invoice_date", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Total</label>
                <input readOnly className={inputCls + " bg-slate-50 text-slate-700"} value={`${invoiceTotal.toLocaleString("de-DE")} ${invoice.currency}`} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={form.status} onChange={(e) => update("status", e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Financial Result</label>
                <div className={`px-3 py-2 rounded-lg text-sm border font-medium leading-[1.375rem] ${marginBgClass(marginPct)} ${marginColorClass(marginPct)}`}>
                  {financialResult.toLocaleString("de-DE")} {invoice.currency} · {marginPct}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — Purchase (what we were billed) */}
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Purchase</h3>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>LC AG Invoice #</label>
              <input className={inputCls} value={form.lc_ag_invoice_number} onChange={(e) => update("lc_ag_invoice_number", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" className={inputCls} value={form.lc_ag_invoice_date} onChange={(e) => update("lc_ag_invoice_date", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Total</label>
                <input
                  className={inputCls}
                  value={lcAgTotalText}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setLcAgTotalText(e.target.value)}
                  onBlur={() => setLcAgTotalText(amountFormatter.format(parseLocaleNumber(lcAgTotalText)))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Logistic DE – MN</label>
                <input
                  className={inputCls}
                  value={logisticsDeMnText}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setLogisticsDeMnText(e.target.value)}
                  onBlur={() => setLogisticsDeMnText(amountFormatter.format(parseLocaleNumber(logisticsDeMnText)))}
                />
              </div>
              <div>
                <label className={labelCls}>Logistic MN – {dealerCountryCode}</label>
                <input
                  className={inputCls}
                  value={logisticsMnXxText}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setLogisticsMnXxText(e.target.value)}
                  onBlur={() => setLogisticsMnXxText(amountFormatter.format(parseLocaleNumber(logisticsMnXxText)))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
        {justSaved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <Check size={16} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
