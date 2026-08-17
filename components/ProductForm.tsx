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
    brand: product?.brand ?? "",
    group_name: product?.group_name ?? "",
    category: product?.category ?? "",
    subgroup: product?.subgroup ?? "",
    list_price: product?.list_price ?? 0,
    dealer_price: product?.dealer_price ?? 0,
    retail_price_incl_vat: product?.retail_price_incl_vat ?? 0,
    customs_tariff_no: product?.customs_tariff_no ?? "",
    country_of_origin: product?.country_of_origin ?? "",
    gross_weight: product?.gross_weight ?? "",
    net_weight: product?.net_weight ?? "",
    weight_unit: product?.weight_unit ?? "kg",
    volume: product?.volume ?? "",
    volume_unit: product?.volume_unit ?? "m3",
    dimensions: product?.dimensions ?? "",
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
    const payload = {
      ...form,
      gross_weight: form.gross_weight === "" ? null : Number(form.gross_weight),
      net_weight: form.net_weight === "" ? null : Number(form.net_weight),
      volume: form.volume === "" ? null : Number(form.volume),
    };
    if (isEdit) {
      const { error } = await supabase
        .from("products")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", product.id);
      if (error) setError(error.message);
      else router.push(`/products/${product.id}`);
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select().single();
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Order-No. *</label>
          <input required className={inputCls} value={form.sku} onChange={(e) => update("sku", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Brand</label>
          <input className={inputCls} value={form.brand} onChange={(e) => update("brand", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Product Name *</label>
          <input required className={inputCls} value={form.product_name} onChange={(e) => update("product_name", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <input className={inputCls} value={form.category} onChange={(e) => update("category", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Group</label>
          <input className={inputCls} value={form.group_name} onChange={(e) => update("group_name", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Sub-Category</label>
          <input className={inputCls} value={form.subgroup} onChange={(e) => update("subgroup", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>List Price</label>
          <input type="number" step="0.01" className={inputCls} value={form.list_price} onChange={(e) => update("list_price", Number(e.target.value))} />
        </div>
        <div>
          <label className={labelCls}>Dealer Price</label>
          <input type="number" step="0.01" className={inputCls} value={form.dealer_price} onChange={(e) => update("dealer_price", Number(e.target.value))} />
        </div>
        <div>
          <label className={labelCls}>Retail Price incl. VAT</label>
          <input type="number" step="0.01" className={inputCls} value={form.retail_price_incl_vat} onChange={(e) => update("retail_price_incl_vat", Number(e.target.value))} />
        </div>
      </div>

      <div>
        <div className="text-xs font-medium text-slate-500 mb-2 mt-2">Customs &amp; Logistics</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Customs Tariff No.</label>
            <input className={inputCls} value={form.customs_tariff_no} onChange={(e) => update("customs_tariff_no", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Country of Origin</label>
            <input className={inputCls} value={form.country_of_origin} onChange={(e) => update("country_of_origin", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Gross Weight</label>
            <div className="flex gap-2">
              <input type="number" step="0.001" className={inputCls} value={form.gross_weight} onChange={(e) => update("gross_weight", e.target.value)} />
              <select className={inputCls + " w-24 shrink-0"} value={form.weight_unit} onChange={(e) => update("weight_unit", e.target.value)}>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="lb">lb</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Net Weight</label>
            <input type="number" step="0.001" className={inputCls} value={form.net_weight} onChange={(e) => update("net_weight", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Volume</label>
            <div className="flex gap-2">
              <input type="number" step="0.0001" className={inputCls} value={form.volume} onChange={(e) => update("volume", e.target.value)} />
              <select className={inputCls + " w-24 shrink-0"} value={form.volume_unit} onChange={(e) => update("volume_unit", e.target.value)}>
                <option value="m3">m³</option>
                <option value="cm3">cm³</option>
                <option value="l">l</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Dimensions</label>
            <input placeholder="e.g. 30x20x10 cm" className={inputCls} value={form.dimensions} onChange={(e) => update("dimensions", e.target.value)} />
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={saving} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50">
        {saving ? "Saving..." : isEdit ? "Save" : "Create product"}
      </button>
    </form>
  );
}
