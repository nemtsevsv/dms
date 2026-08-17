"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getNextOrderNumber } from "@/lib/documentNumbering";

export default function OrderForm({ dealers, defaultOrderNumber }: { dealers: { id: string; company_name: string }[]; defaultOrderNumber: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tracks whether the person typed into the Order Number field themselves
  // — if so, their value is respected as-is (they may be intentionally
  // assigning a specific number by hand); if not, the number is
  // recomputed fresh right before saving, since the page's initial
  // suggestion can otherwise go stale (e.g. if the page was opened a
  // while ago, or served from a cached render) and silently repeat a
  // number that's since been taken.
  const manuallyEdited = useRef(false);

  const [form, setForm] = useState({
    order_number: defaultOrderNumber,
    dealer_id: dealers[0]?.id ?? "",
    order_date: new Date().toISOString().slice(0, 10),
    currency: "EUR",
  });

  // Re-check the suggested number as soon as the form actually mounts in
  // the browser, rather than trusting only what the server rendered.
  useEffect(() => {
    getNextOrderNumber(supabase).then((fresh) => {
      if (!manuallyEdited.current) setForm((f) => ({ ...f, order_number: fresh }));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function update(field: string, value: any) {
    if (field === "order_number") manuallyEdited.current = true;
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Final safety net: if the person never touched the field themselves,
    // take one more fresh number right at save time so two people opening
    // "New Order" around the same time can't end up with the same number.
    const orderNumber = manuallyEdited.current ? form.order_number : await getNextOrderNumber(supabase);

    const { data, error } = await supabase
      .from("orders")
      .insert({ ...form, order_number: orderNumber, status: "New", created_by: user?.email ?? null })
      .select()
      .single();
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
