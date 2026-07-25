"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OrderForm({ dealers }: { dealers: { id: string; company_name: string }[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    order_number: `ORD-${Date.now().toString().slice(-6)}`,
    dealer_id: dealers[0]?.id ?? "",
    order_date: new Date().toISOString().slice(0, 10),
    currency: "EUR",
  });

  function update(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { data, error } = await supabase.from("orders").insert({ ...form, status: "New" }).select().single();
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    router.push(`/orders/${data.id}`);
    router.refresh();
  }

  const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className={labelCls}>Order Number</label>
        <input required className={inputCls} value={form.order_number} onChange={(e) => update("order_number", e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Dealer *</label>
        <select required className={inputCls} value={form.dealer_id} onChange={(e) => update("dealer_id", e.target.value)}>
          <option value="">— select a dealer —</option>
          {dealers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.company_name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Order Date</label>
          <input type="date" className={inputCls} value={form.order_date} onChange={(e) => update("order_date", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Currency</label>
          <select className={inputCls} value={form.currency} onChange={(e) => update("currency", e.target.value)}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={saving || !form.dealer_id} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50">
        {saving ? "Creating..." : "Create Order"}
      </button>
    </form>
  );
}
