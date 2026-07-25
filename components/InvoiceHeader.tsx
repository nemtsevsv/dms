"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUSES = ["Draft", "Sent", "Paid", "Cancelled"];

export default function InvoiceHeader({ invoice }: { invoice: any }) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    invoice_number: invoice.invoice_number,
    invoice_date: invoice.invoice_date,
    status: invoice.status,
  });
  const [saving, setSaving] = useState(false);

  function update(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save() {
    setSaving(true);
    await supabase.from("invoices").update({ ...form, updated_at: new Date().toISOString() }).eq("id", invoice.id);
    setSaving(false);
    router.refresh();
  }

  const inputCls = "px-3 py-2 border border-slate-300 rounded-lg text-sm";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className={labelCls}>Invoice Number</label>
          <input className={inputCls + " w-full"} value={form.invoice_number} onChange={(e) => update("invoice_number", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Invoice Date</label>
          <input type="date" className={inputCls + " w-full"} value={form.invoice_date} onChange={(e) => update("invoice_date", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select className={inputCls + " w-full"} value={form.status} onChange={(e) => update("status", e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button onClick={save} disabled={saving} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
