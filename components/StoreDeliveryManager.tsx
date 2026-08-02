"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

type Product = { sku: string; product_name: string };
type Delivery = { id: string; delivery_date: string; note: string | null; created_by: string | null; item_count: number };

export default function StoreDeliveryManager({ storeId, products, deliveries }: { storeId: string; products: Product[]; deliveries: Delivery[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [movementType, setMovementType] = useState<"initial" | "delivery">("delivery");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);

  const productBySku = new Map(products.map((p) => [p.sku.toLowerCase(), p]));

  async function submit() {
    setSaving(true);
    setResult(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const rows: { sku: string; product_name: string; quantity: number }[] = [];
    let skipped = 0;
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      const [skuRaw, qtyRaw] = line.split(/\s+/);
      const sku = (skuRaw ?? "").trim();
      const qty = Number((qtyRaw ?? "").replace(",", "."));
      if (!sku || !qty) {
        skipped++;
        continue;
      }
      const match = productBySku.get(sku.toLowerCase());
      rows.push({ sku, product_name: match?.product_name ?? sku, quantity: qty });
    }

    if (rows.length === 0) {
      setSaving(false);
      setResult({ added: 0, skipped });
      return;
    }

    const { data: delivery } = await supabase
      .from("store_deliveries")
      .insert({
        store_id: storeId,
        note: movementType === "initial" ? "Initial stock load" : "Delivery",
        created_by: user?.email ?? null,
      })
      .select()
      .single();

    if (delivery) {
      await supabase.from("store_delivery_items").insert(rows.map((r) => ({ delivery_id: delivery.id, ...r })));
      await supabase.from("store_stock_movements").insert(
        rows.map((r) => ({
          store_id: storeId,
          sku: r.sku,
          product_name: r.product_name,
          type: movementType,
          quantity: r.quantity,
          reference_id: delivery.id,
          created_by: user?.email ?? null,
        }))
      );
    }

    setText("");
    setSaving(false);
    setResult({ added: rows.length, skipped });
    router.refresh();
  }

  return (
    <div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-medium mb-2">Add stock</h3>
        <p className="text-xs text-slate-500 mb-2">
          One line per item: <code>Order-No. Quantity</code> (space separated), e.g. <code>10302 5</code>. Product name is
          pulled from the catalog automatically when found.
        </p>
        <div className="flex items-center gap-3 mb-2">
          <label className="text-sm flex items-center gap-1">
            <input type="radio" checked={movementType === "delivery"} onChange={() => setMovementType("delivery")} /> New delivery
          </label>
          <label className="text-sm flex items-center gap-1">
            <input type="radio" checked={movementType === "initial"} onChange={() => setMovementType("initial")} /> Initial stock (one-time load)
          </label>
        </div>
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"10302 5\n11826 2"}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono mb-2"
        />
        <button
          onClick={submit}
          disabled={saving || !text.trim()}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add stock"}
        </button>
        {result && (
          <p className="text-sm mt-2">
            <span className="text-emerald-700">{result.added} items added</span>
            {result.skipped > 0 && <span className="text-amber-600"> · {result.skipped} lines skipped (missing Order-No. or quantity)</span>}
          </p>
        )}
      </div>

      <h3 className="text-sm font-medium mb-2">History</h3>
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">By</th>
              <th className="text-right px-4 py-3">Items</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((d) => (
              <tr key={d.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-500">{format(new Date(d.delivery_date), "dd.MM.yyyy")}</td>
                <td className="px-4 py-3">{d.note}</td>
                <td className="px-4 py-3 text-slate-500">{d.created_by}</td>
                <td className="px-4 py-3 text-right">{d.item_count}</td>
              </tr>
            ))}
            {deliveries.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-400">
                  No deliveries recorded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
