"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ACTIVITY_STATUSES, activityStatusHex } from "@/lib/marketingStatusColors";

const budgetFormatter = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
function parseLocaleNumber(s: string): number {
  return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
}

const CURRENCIES = ["EUR", "KZT", "AMD", "USD"];

export default function MarketingActivityForm({ activity }: { activity?: any }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!activity;

  const [form, setForm] = useState({
    name: activity?.name ?? "",
    activity_type: activity?.activity_type ?? "",
    status: activity?.status ?? "Planned",
    start_date: activity?.start_date ?? "",
    end_date: activity?.end_date ?? "",
    country: activity?.country ?? "",
    store_id: activity?.store_id ?? "",
    dealer_id: activity?.dealer_id ?? "",
    currency: activity?.currency ?? "EUR",
    notes: activity?.notes ?? "",
  });
  const [budgetPlannedText, setBudgetPlannedText] = useState(budgetFormatter.format(activity?.budget_planned ?? 0));
  const [budgetActualText, setBudgetActualText] = useState(budgetFormatter.format(activity?.budget_actual ?? 0));
  const [types, setTypes] = useState<string[]>([]);
  const [newType, setNewType] = useState("");
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [dealers, setDealers] = useState<{ id: string; company_name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  async function loadTypes() {
    const { data } = await supabase.from("marketing_activity_types").select("name").order("name");
    setTypes((data ?? []).map((t) => t.name));
  }

  useEffect(() => {
    loadTypes();
    supabase.from("stores").select("id, name").eq("status", "Active").order("name").then(({ data }) => setStores(data ?? []));
    supabase.from("dealers").select("id, company_name").order("company_name").then(({ data }) => setDealers(data ?? []));
  }, []);

  function update(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function addNewType() {
    const name = newType.trim();
    if (!name) return;
    await supabase.from("marketing_activity_types").insert({ name });
    setNewType("");
    await loadTypes();
    update("activity_type", name);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      ...form,
      store_id: form.store_id || null,
      dealer_id: form.dealer_id || null,
      country: form.country || null,
      activity_type: form.activity_type || null,
      budget_planned: parseLocaleNumber(budgetPlannedText),
      budget_actual: parseLocaleNumber(budgetActualText),
    };

    if (isEdit) {
      await supabase.from("marketing_activities").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", activity.id);
      router.push(`/marketing-activities/${activity.id}`);
    } else {
      const { data } = await supabase
        .from("marketing_activities")
        .insert({ ...payload, created_by: user?.email ?? null })
        .select()
        .single();
      router.push(`/marketing-activities/${data?.id}`);
    }
    router.refresh();
    setSaving(false);
  }

  const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls}>Activity Name *</label>
          <input required className={inputCls} value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>

        <div>
          <label className={labelCls}>Type</label>
          <select className={inputCls} value={form.activity_type} onChange={(e) => update("activity_type", e.target.value)}>
            <option value="">—</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div className="flex gap-2 mt-1.5">
            <input
              placeholder="Add a new type..."
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs"
            />
            <button type="button" onClick={addNewType} className="text-xs text-slate-500 hover:text-slate-800 underline whitespace-nowrap">
              + Add
            </button>
          </div>
        </div>

        <div>
          <label className={labelCls}>Status</label>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: activityStatusHex(form.status) }} />
            <select className={inputCls} value={form.status} onChange={(e) => update("status", e.target.value)}>
              {ACTIVITY_STATUSES.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Start Date *</label>
          <input required type="date" className={inputCls} value={form.start_date} onChange={(e) => update("start_date", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>End Date *</label>
          <input required type="date" className={inputCls} value={form.end_date} onChange={(e) => update("end_date", e.target.value)} />
        </div>
      </div>

      <div>
        <div className="text-xs font-medium text-slate-500 mb-2">
          Scope — leave everything blank for a company-wide activity, or fill in one of the fields below
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div>
            <label className={labelCls}>Country</label>
            <input className={inputCls} value={form.country} onChange={(e) => update("country", e.target.value)} placeholder="e.g. Kazakhstan" />
          </div>
          <div>
            <label className={labelCls}>Store</label>
            <select className={inputCls} value={form.store_id} onChange={(e) => update("store_id", e.target.value)}>
              <option value="">—</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Dealer</label>
            <select className={inputCls} value={form.dealer_id} onChange={(e) => update("dealer_id", e.target.value)}>
              <option value="">—</option>
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.company_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Budget Planned</label>
          <input className={inputCls} value={budgetPlannedText} onBlur={(e) => setBudgetPlannedText(budgetFormatter.format(parseLocaleNumber(e.target.value)))} onChange={(e) => setBudgetPlannedText(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Budget Actual</label>
          <input className={inputCls} value={budgetActualText} onBlur={(e) => setBudgetActualText(budgetFormatter.format(parseLocaleNumber(e.target.value)))} onChange={(e) => setBudgetActualText(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Currency</label>
          <select className={inputCls} value={form.currency} onChange={(e) => update("currency", e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea className={inputCls} rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
      </div>

      <button type="submit" disabled={saving} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50">
        {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Activity"}
      </button>
    </form>
  );
}
