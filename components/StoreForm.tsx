"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { defaultSchedule } from "@/lib/storeSchedule";
import { COMMON_TIMEZONES, DEFAULT_STORE_TIMEZONE } from "@/lib/storeTimezone";

const CURRENCIES = ["EUR", "USD", "KZT", "AMD", "UZS", "KGS", "GEL", "AZN", "TJS", "TMT"];

export default function StoreForm({ store }: { store?: any }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!store;

  const [form, setForm] = useState({
    name: store?.name ?? "",
    country: store?.country ?? "",
    city: store?.city ?? "",
    address: store?.address ?? "",
    currency: store?.currency ?? "EUR",
    timezone: store?.timezone ?? DEFAULT_STORE_TIMEZONE,
    status: store?.status ?? "Active",
  });
  const [fxRateText, setFxRateText] = useState(String(store?.fx_rate_to_eur ?? 1));
  const [saving, setSaving] = useState(false);

  function update(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      fx_rate_to_eur: Number(fxRateText.replace(",", ".")) || 1,
      fx_rate_updated_at: new Date().toISOString(),
    };

    if (isEdit) {
      await supabase.from("stores").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", store.id);
      router.push(`/stores/${store.id}`);
    } else {
      const { data, error } = await supabase.from("stores").insert(payload).select().single();
      if (!error && data) {
        // Seed a default weekly schedule so daily-target and working-hours
        // calculations have something to work with immediately.
        await supabase.from("store_schedule").insert(defaultSchedule().map((s) => ({ ...s, store_id: data.id })));
        router.push(`/stores/${data.id}`);
      }
    }
    router.refresh();
    setSaving(false);
  }

  const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls}>Store Name *</label>
          <input required className={inputCls} value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Country</label>
          <input className={inputCls} value={form.country} onChange={(e) => update("country", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>City</label>
          <input className={inputCls} value={form.city} onChange={(e) => update("city", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Address</label>
          <input className={inputCls} value={form.address} onChange={(e) => update("address", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Local Currency</label>
          <select className={inputCls} value={form.currency} onChange={(e) => update("currency", e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>FX Rate to EUR (1 {form.currency} = ? EUR)</label>
          <input
            type="text"
            inputMode="decimal"
            className={inputCls}
            value={fxRateText}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setFxRateText(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Timezone</label>
          <select className={inputCls} value={form.timezone} onChange={(e) => update("timezone", e.target.value)}>
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
        {isEdit && (
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? "Saving..." : isEdit ? "Save changes" : "Create store"}
      </button>
    </form>
  );
}
