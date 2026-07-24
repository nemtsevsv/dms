"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProductForm({ product }: { product?: any }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!product;

  const [form, setForm] = useState({
    sku: product?.sku ?? "",
    product_name: product?.product_name ?? "",
    category: product?.category ?? "",
    purchase_price: product?.purchase_price ?? 0,
    dealer_price: product?.dealer_price ?? 0,
    retail_price: product?.retail_price ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    if (isEdit) {
      const { error } = await supabase
        .from("products")
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq("id", product.id);
      if (error) setError(error.message);
      else router.push(`/products/${product.id}`);
    } else {
      const { data, error } = await supabase.from("products").insert(form).select().single();
      if (error) setError(error.message);
      else router.push(`/products/${data.id}`);
    }
    router.refresh();
    setSaving(false);
  }

  const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>SKU *</label>
          <input required className={inputCls} value={form.sku} onChange={(e) => update("sku", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Категория</label>
          <input className={inputCls} value={form.category} onChange={(e) => update("category", e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Название продукта *</label>
          <input required className={inputCls} value={form.product_name} onChange={(e) => update("product_name", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Закупочная цена</label>
          <input type="number" step="0.01" className={inputCls} value={form.purchase_price} onChange={(e) => update("purchase_price", Number(e.target.value))} />
        </div>
        <div>
          <label className={labelCls}>Цена дилера</label>
          <input type="number" step="0.01" className={inputCls} value={form.dealer_price} onChange={(e) => update("dealer_price", Number(e.target.value))} />
        </div>
        <div>
          <label className={labelCls}>Розничная цена</label>
          <input type="number" step="0.01" className={inputCls} value={form.retail_price} onChange={(e) => update("retail_price", Number(e.target.value))} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={saving} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50">
        {saving ? "Сохранение..." : isEdit ? "Сохранить" : "Создать продукт"}
      </button>
    </form>
  );
}
