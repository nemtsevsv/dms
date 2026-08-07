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
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  function update(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save() {
    setSaving(true);
    setJustSaved(false);
    await supabase
      .from("invoices")
      .update({
        invoice_number: form.invoice_number,
        invoice_date: form.invoice_date,
        status: form.status,
        lc_ag_invoice_number: form.lc_ag_invoice_number || null,
        lc_ag_invoice_date: form.lc_ag_invoice_date || null,
        lc_ag_invoice_total: form.lc_ag_invoice_total === "" ? null : Number(form.lc_ag_invoice_total),
        logistics_de_mn: form.logistics_de_mn === "" ? null : Number(form.logistics_de_mn),
        logistics_mn_xx: form.logistics_mn_xx === "" ? null : Number(form.logistics_mn_xx),
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);
    setSaving(false);
    setJustSaved(true);
    router.refresh();
    setTimeout(() => setJustSaved(false), 2500);
  }

  const lcAgTotal = Number(form.lc_ag_invoice_total) || 0;
  const logisticsDeMn = Number(form.logistics_de_mn) || 0;
  const logisticsMnXx = Number(form.logistics_mn_xx) || 0;
  const financialResult = round2(invoiceTotal - lcAgTotal - logisticsDeMn - logisticsMnXx);
  const marginPct = invoiceTotal > 0 ? round2((financialResult / invoiceTotal) * 100) : 0;

  const inputCls = "px-3 py-2 border border-slate-300 rounded-lg text-sm w-full";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5">
        {/* Left column — the invoice itself */}
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Invoice Number</label>
            <input className={inputCls} value={form.invoice_number} onChange={(e) => update("invoice_number", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Invoice Date</label>
            <input type="date" className={inputCls} value={form.invoice_date} onChange={(e) => update("invoice_date", e.target.value)} />
          </div>
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
        </div>

        {/* Right column — Purchase (what we were billed) */}
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Purchase</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="col-span-2">
              <label className={labelCls}>LC AG Invoice #</label>
              <input className={inputCls} value={form.lc_ag_invoice_number} onChange={(e) => update("lc_ag_invoice_number", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" className={inputCls} value={form.lc_ag_invoice_date} onChange={(e) => update("lc_ag_invoice_date", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Total</label>
              <input type="number" step="0.01" className={inputCls} value={form.lc_ag_invoice_total} onChange={(e) => update("lc_ag_invoice_total", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Logistic DE – MN</label>
              <input type="number" step="0.01" className={inputCls} value={form.logistics_de_mn} onChange={(e) => update("logistics_de_mn", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Logistic MN – {dealerCountryCode}</label>
              <input type="number" step="0.01" className={inputCls} value={form.logistics_mn_xx} onChange={(e) => update("logistics_mn_xx", e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Result — automatic */}
      <div className={`rounded-xl border p-4 mb-5 ${marginBgClass(marginPct)}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Financial Result</div>
            <div className="text-xs text-slate-400">Invoice to dealer − LC AG invoice − Logistics DE–MN − Logistics MN–{dealerCountryCode}</div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-semibold ${marginColorClass(marginPct)}`}>
              {financialResult.toLocaleString("de-DE")} {invoice.currency}
            </div>
            <div className={`text-sm font-medium ${marginColorClass(marginPct)}`}>{marginPct}% margin</div>
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
