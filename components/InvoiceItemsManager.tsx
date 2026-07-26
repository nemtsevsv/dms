"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";

type Item = {
  id: string;
  sku: string | null;
  product_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
};

export default function InvoiceItemsManager({ invoiceId, items, currency }: { invoiceId: string; items: Item[]; currency: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [justSaved, setJustSaved] = useState(false);

  async function updateItem(id: string, field: string, value: number) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const updated = { ...item, [field]: value };
    const total = (Number(updated.quantity) || 0) * (Number(updated.unit_price) || 0);
    await supabase.from("invoice_items").update({ [field]: value, total }).eq("id", id);
    setJustSaved(true);
    router.refresh();
    setTimeout(() => setJustSaved(false), 2000);
  }

  async function deleteItem(id: string) {
    await supabase.from("invoice_items").delete().eq("id", id);
    router.refresh();
  }

  const total = items.reduce((s, i) => s + (Number(i.total) || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">Changes save automatically when you leave a field</span>
        {justSaved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <Check size={14} /> Saved
          </span>
        )}
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm mb-4">
        <table className="w-full text-sm min-w-[500px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">SKU</th>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-right px-4 py-3">Qty</th>
              <th className="text-right px-4 py-3">Price</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{i.sku}</td>
                <td className="px-4 py-3">{i.product_name}</td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    defaultValue={i.quantity ?? 0}
                    onBlur={(e) => updateItem(i.id, "quantity", Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-slate-200 rounded text-right"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={i.unit_price ?? 0}
                    onBlur={(e) => updateItem(i.id, "unit_price", Number(e.target.value))}
                    className="w-24 px-2 py-1 border border-slate-200 rounded text-right"
                  />
                </td>
                <td className="px-4 py-3 text-right font-medium">{i.total?.toLocaleString("de-DE")}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => deleteItem(i.id)} className="text-xs text-slate-400 hover:text-red-600">
                    delete
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  No items on this invoice
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm">
        Total: <span className="font-semibold">{total.toLocaleString("de-DE")} {currency}</span>
      </div>
    </div>
  );
}
