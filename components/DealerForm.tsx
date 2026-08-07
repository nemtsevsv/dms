"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TagMultiSelect from "./TagMultiSelect";
import { DEALER_STATUSES, dealerStatusHex } from "@/lib/statusColors";
import { ExternalLink } from "lucide-react";

const planFormatter = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const discountFormatter = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function parseLocaleNumber(s: string): number {
  return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
}

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
    ai_notes: dealer?.ai_notes ?? "",
    product_categories: dealer?.product_categories ?? [],
    brands: dealer?.brands ?? [],
  });
  // Kept as text so the fields can show locale-formatted numbers
  // (thousands "." for the plan, decimal "," for the discount) while
  // still being easy to edit — reformatted on blur, parsed on save.
  const [discountText, setDiscountText] = useState(discountFormatter.format(dealer?.discount_percent ?? 0));
  const [planText, setPlanText] = useState(planFormatter.format(dealer?.annual_sales_plan ?? 0));
  const [managers, setManagers] = useState<{ email: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .then(({ data }) => {
        setManagers(
          (data ?? []).map((p: any) => ({
            email: p.email,
            name: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email,
          }))
        );
      });
  }, []);

  function update(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      ...form,
      discount_percent: parseLocaleNumber(discountText),
      annual_sales_plan: parseLocaleNumber(planText),
    };

    if (isEdit) {
      await supabase
        .from("dealers")
        .update({ ...payload, updated_at: new Date().toISOString(), updated_by: user?.email ?? null })
        .eq("id", dealer.id);
      router.push(`/dealers/${dealer.id}`);
    } else {
      const { data } = await supabase
        .from("dealers")
        .insert({ ...payload, updated_by: user?.email ?? null })
        .select()
        .single();
      router.push(`/dealers/${data?.id}`);
    }
    router.refresh();
    setSaving(false);
  }

  const inputCls =
    "w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300";
  const labelCls = "block text-xs font-medium text-slate-500 mb-0.5";

  // If the dealer's current manager isn't in the profiles list (e.g. typed
  // manually before this feature existed), keep it selectable so nothing breaks.
  const managerOptions =
    form.assigned_manager && !managers.some((m) => m.email === form.assigned_manager)
      ? [...managers, { email: form.assigned_manager, name: form.assigned_manager }]
      : managers;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Company Name *</label>
          <input required className={inputCls} value={form.company_name} onChange={(e) => update("company_name", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dealerStatusHex(form.status) }} />
            <select className={inputCls} value={form.status} onChange={(e) => update("status", e.target.value)}>
              {DEALER_STATUSES.map((s) => (
                <option key={s.name} value={s.name} style={{ color: s.hex }}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Assigned Manager</label>
          <select className={inputCls} value={form.assigned_manager} onChange={(e) => update("assigned_manager", e.target.value)}>
            <option value="">— none —</option>
            {managerOptions.map((m) => (
              <option key={m.email} value={m.email}>
                {m.name}
              </option>
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
        <div>
          <label className={labelCls}>Website</label>
          <div className="flex items-center gap-2">
            <input className={inputCls} value={form.website} onChange={(e) => update("website", e.target.value)} />
            {form.website && (
              <a
                href={form.website.startsWith("http") ? form.website : `https://${form.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-700 shrink-0"
                title="Open website"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className={labelCls}>Address</label>
          <input className={inputCls} value={form.address} onChange={(e) => update("address", e.target.value)} />
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
          <input
            type="text"
            inputMode="decimal"
            className={inputCls}
            value={discountText}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setDiscountText(e.target.value)}
            onBlur={() => setDiscountText(discountFormatter.format(parseLocaleNumber(discountText)))}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <label className={labelCls}>Annual Sales Plan (EUR) — current fiscal year</label>
          <input
            type="text"
            inputMode="decimal"
            className={inputCls}
            value={planText}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setPlanText(e.target.value)}
            onBlur={() => setPlanText(planFormatter.format(parseLocaleNumber(planText)))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <textarea className={inputCls} rows={2} value={form.ai_notes} onChange={(e) => update("ai_notes", e.target.value)} />
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
