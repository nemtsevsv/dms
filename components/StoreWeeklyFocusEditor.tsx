"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toDateStr } from "@/lib/isoWeek";
import { Check } from "lucide-react";

export default function StoreWeeklyFocusEditor({
  storeId,
  weekStart,
  weekEnd,
  focus,
  editable,
}: {
  storeId: string;
  weekStart: Date;
  weekEnd: Date;
  focus: { product_focus: string | null; customer_focus: string | null; activity_focus: string | null } | null;
  editable: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [product, setProduct] = useState(focus?.product_focus ?? "");
  const [customer, setCustomer] = useState(focus?.customer_focus ?? "");
  const [activity, setActivity] = useState(focus?.activity_focus ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const period = `${weekStart.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" })} – ${weekEnd.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" })}`;

  async function save() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("store_weekly_focus").upsert(
      {
        store_id: storeId,
        week_start_date: toDateStr(weekStart),
        product_focus: product,
        customer_focus: customer,
        activity_focus: activity,
        set_by: user?.email ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "store_id,week_start_date" }
    );
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm";

  if (!editable) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-medium mb-3">This week's focus <span className="text-slate-400 font-normal">({period})</span></h3>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-xs text-slate-400">Product focus</dt>
            <dd>{focus?.product_focus || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Customer focus</dt>
            <dd>{focus?.customer_focus || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Activity focus</dt>
            <dd>{focus?.activity_focus || "—"}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-medium mb-3">This week's focus <span className="text-slate-400 font-normal">({period}) — visible to the whole team</span></h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Product focus</label>
          <input className={inputCls} value={product} onChange={(e) => setProduct(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Customer focus</label>
          <input className={inputCls} value={customer} onChange={(e) => setCustomer(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Activity focus</label>
          <input className={inputCls} value={activity} onChange={(e) => setActivity(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-600">
              <Check size={14} /> Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
