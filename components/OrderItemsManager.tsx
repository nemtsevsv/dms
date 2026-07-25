"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Item = {
  id: string;
  sku: string | null;
  product_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
  status: string;
};

type Product = {
  sku: string;
  product_name: string;
  list_price: number | null;
};

const STATUS_OPTIONS = ["Waiting", "Invoiced", "Cancelled"];

const statusStyle: Record<string, string> = {
  Waiting: "bg-amber-100 text-amber-700",
  Invoiced: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-700",
};

export default function OrderItemsManager({
  orderId,
  items,
  currency,
  products,
  dealerDiscount,
}: {
  orderId: string;
  items: Item[];
  currency: string;
  products: Product[];
  dealerDiscount: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  const [newItem, setNewItem] = useState({ sku: "", product_name: "", quantity: 1, unit_price: 0 });

  function priceFromList(listPrice: number) {
    return Math.round(listPrice * (1 - dealerDiscount / 100) * 100) / 100;
  }

  function handleSkuSelect(sku: string) {
    const product = products.find((p) => p.sku === sku);
    if (product) {
      setNewItem({
        sku: product.sku,
        product_name: product.product_name,
        quantity: 1,
        unit_price: priceFromList(product.list_price ?? 0),
      });
    } else {
      setNewItem((f) => ({ ...f, sku }));
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.product_name.trim()) return;
    setSaving(true);
    const total = newItem.quantity * newItem.unit_price;
    await supabase.from("order_items").insert({
      order_id: orderId,
      sku: newItem.sku,
      product_name: newItem.product_name,
      quantity: newItem.quantity,
      unit_price: newItem.unit_price,
      total,
      status: "Waiting",
    });
    setNewItem({ sku: "", product_name: "", quantity: 1, unit_price: 0 });
    setSaving(false);
    router.refresh();
  }

  async function updateStatus(itemId: string, status: string) {
    await supabase.from("order_items").update({ status }).eq("id", itemId);
    router.refresh();
  }

  async function deleteItem(itemId: string) {
    await supabase.from("order_items").delete().eq("id", itemId);
    router.refresh();
  }

  const totalActive = items.filter((i) => i.status !== "Cancelled").reduce((s, i) => s + (Number(i.total) || 0), 0);
  const totalInvoiced = items.filter((i) => i.status === "Invoiced").reduce((s, i) => s + (Number(i.total) || 0), 0);
  const totalWaiting = items.filter((i) => i.status === "Waiting").reduce((s, i) => s + (Number(i.total) || 0), 0);

  const inputCls = "px-2 py-1.5 border border-slate-300 rounded-lg text-sm";

  return (
    <div>
      <form onSubmit={addItem} className="flex flex-wrap gap-2 mb-4 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">SKU (from catalog)</label>
          <select className={`${inputCls} w-48`} value={newItem.sku} onChange={(e) => handleSkuSelect(e.target.value)}>
            <option value="">— type manually below —</option>
            {products.map((p) => (
              <option key={p.sku} value={p.sku}>
                {p.sku} — {p.product_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Product</label>
          <input
            className={`${inputCls} w-48`}
            value={newItem.product_name}
            onChange={(e) => setNewItem((f) => ({ ...f, product_name: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Qty</label>
          <input
            type="number"
            className={`${inputCls} w-20`}
            value={newItem.quantity}
            onChange={(e) => setNewItem((f) => ({ ...f, quantity: Number(e.target.value) }))}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Price (List − {dealerDiscount}%)</label>
          <input
            type="number"
            step="0.01"
            className={`${inputCls} w-28`}
            value={newItem.unit_price}
            onChange={(e) => setNewItem((f) => ({ ...f, unit_price: Number(e.target.value) }))}
          />
        </div>
        <button disabled={saving} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50">
          + Add Item
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm mb-4">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">SKU</th>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-right px-4 py-3">Qty</th>
              <th className="text-right px-4 py-3">Price</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{i.sku}</td>
                <td className="px-4 py-3">{i.product_name}</td>
                <td className="px-4 py-3 text-right">{i.quantity}</td>
                <td className="px-4 py-3 text-right">{i.unit_price?.toLocaleString("de-DE")}</td>
                <td className="px-4 py-3 text-right font-medium">{i.total?.toLocaleString("de-DE")}</td>
                <td className="px-4 py-3">
                  <select
                    value={i.status}
                    onChange={(e) => updateStatus(i.id, e.target.value)}
                    className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${statusStyle[i.status]}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => deleteItem(i.id)} className="text-xs text-slate-400 hover:text-red-600">
                    delete
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  No items yet — add the first one above
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-4 sm:gap-6 text-sm bg-slate-50 border border-slate-200 rounded-xl px-5 py-3">
        <div>
          Total (excl. cancelled): <span className="font-semibold">{totalActive.toLocaleString("de-DE")} {currency}</span>
        </div>
        <div className="text-emerald-700">
          Invoiced: <span className="font-semibold">{totalInvoiced.toLocaleString("de-DE")} {currency}</span>
        </div>
        <div className="text-amber-700">
          Waiting: <span className="font-semibold">{totalWaiting.toLocaleString("de-DE")} {currency}</span>
        </div>
      </div>
    </div>
  );
}
