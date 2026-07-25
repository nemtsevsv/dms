"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TagMultiSelect from "./TagMultiSelect";

const STATUSES = ["New", "First Contact", "Negotiation", "Contract Signing", "Active", "Inactive"];

export default function DealerForm({
  dealer,
}: {
  dealer?: any;
}) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!dealer;

  const [form, setForm] = useState({
    company_name: dealer?.company_name ?? "",
    status: dealer?.status ?? "New",
    country: dealer?.country ?? "",
    city: dealer?.city ?? "",
    address: dealer?.address ?? "",
    website: dealer?.website ?? "",
    contact_person: dealer?.contact_person ?? "",
    phone: dealer?.phone ?? "",
    email: dealer?.email ?? "",
    assigned_manager: dealer?.assigned_manager ?? "",
    discount_percent: dealer?.discount_percent ?? 0,
    annual_sales_plan: dealer?.annual_sales_plan ?? 0,
    ai_notes: dealer?.ai_notes ?? "",
    product_categories: dealer?.product_categories ?? [],
    brands: dealer?.brands ?? [],
  });
  const [saving, setSaving] = useState(false);

  function update(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (isEdit) {
      await supabase
        .from("dealers")
        .update({ ...form, updated_at: new Date().toISOString(), updated_by: user?.email ?? null })
        .eq("id", dealer.id);
      router.push(`/dealers/${dealer.id}`);
    } else {
      const { data } = await supabase
        .from("dealers")
        .insert({ ...form, updated_by: user?.email ?? null })
        .select()
        .single();
      router.push(`/dealers/${data?.id}`);
    }
    router.refresh();
    setSaving(false);
  }

  const inputCls =
    "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Company Name *</label>
          <input required className={inputCls} value={form.company_name} onChange={(e) => update("company_name", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select className={inputCls} value={form.status} onChange={(e) => update("status", e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
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
          <label className={labelCls}>Website</label>
          <input className={inputCls} value={form.website} onChange={(e) => update("website", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Assigned Manager</label>
          <input className={inputCls} value={form.assigned_manager} onChange={(e) => update("assigned_manager", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Contact Person</label>
          <input className={inputCls} value={form.contact_person} onChange={(e) => update("contact_person", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input className={inputCls} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" className={inputCls} value={form.email} onChange={(e) => update("email", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Dealer Discount %</label>
          <input type="number" step="0.1" className={inputCls} value={form.discount_percent} onChange={(e) => update("discount_percent", Number(e.target.value))} />
        </div>
        <div>
          <label className={labelCls}>Annual Sales Plan (EUR)</label>
          <input type="number" step="1" className={inputCls} value={form.annual_sales_plan} onChange={(e) => update("annual_sales_plan", Number(e.target.value))} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TagMultiSelect
          label="Product Categories"
          tableName="product_categories"
          value={form.product_categories}
          onChange={(v) => update("product_categories", v)}
        />
        <TagMultiSelect
          label="Brands"
          tableName="brands"
          value={form.brands}
          onChange={(v) => update("brands", v)}
        />
      </div>

      <div>
        <label className={labelCls}>AI Notes</label>
        <textarea className={inputCls} rows={3} value={form.ai_notes} onChange={(e) => update("ai_notes", e.target.value)} />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create dealer"}
        </button>
      </div>
    </form>
  );
}
