"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, Trash2, X } from "lucide-react";

type Product = { sku: string; product_name: string; local_price: number };

type CartLine = { sku: string; product_name: string; quantity: number; unit_price: number; item_type: "core" | "accessory" };

export default function SalesEntry({
  storeId,
  products,
  currency,
  todayReceiptsCount,
  todaySalesTotal,
}: {
  storeId: string;
  products: Product[];
  currency: string;
  todayReceiptsCount: number;
  todaySalesTotal: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const productBySku = new Map(products.map((p) => [p.sku.toLowerCase(), p]));

  function addFromSearch(value: string) {
    setSearch(value);
    const t = value.trim().toLowerCase();
    const match = products.find((p) => p.sku.toLowerCase() === t || `${p.sku} — ${p.product_name}`.toLowerCase() === t);
    if (!match) return;
    setCart((c) => [...c, { sku: match.sku, product_name: match.product_name, quantity: 1, unit_price: match.local_price, item_type: "core" }]);
    setSearch("");
  }

  function updateLine(idx: number, patch: Partial<CartLine>) {
    setCart((c) => c.map((line, i) => (i === idx ? { ...line, ...patch } : line)));
  }

  function removeLine(idx: number) {
    setCart((c) => c.filter((_, i) => i !== idx));
  }

  const cartTotal = cart.reduce((s, l) => s + l.quantity * l.unit_price, 0);

  async function completeSale() {
    if (cart.length === 0) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: receipt } = await supabase.from("store_receipts").insert({ store_id: storeId, created_by: user?.email ?? null }).select().single();
    if (receipt) {
      await supabase.from("store_receipt_items").insert(
        cart.map((l) => ({
          receipt_id: receipt.id,
          sku: l.sku,
          product_name: l.product_name,
          quantity: l.quantity,
          unit_price: l.unit_price,
          total: Math.round(l.quantity * l.unit_price * 100) / 100,
          item_type: l.item_type,
        }))
      );
      await supabase.from("store_stock_movements").insert(
        cart.map((l) => ({
          store_id: storeId,
          sku: l.sku,
          product_name: l.product_name,
          type: "sale",
          quantity: l.quantity,
          reference_id: receipt.id,
          created_by: user?.email ?? null,
        }))
      );
    }
    setCart([]);
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium">Sales today</h2>
        <span className="text-sm text-slate-500">
          {todayReceiptsCount} receipts · {todaySalesTotal.toLocaleString("de-DE")} {currency}
        </span>
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
        >
          <ShoppingBag size={16} />
          Record a sale
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">New sale</span>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
              <X size={16} />
            </button>
          </div>

          <input
            list="sale-products-datalist"
            placeholder="Search Order-No. or product name..."
            value={search}
            onChange={(e) => addFromSearch(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm mb-3"
          />
          <datalist id="sale-products-datalist">
            {products.map((p) => (
              <option key={p.sku} value={`${p.sku} — ${p.product_name}`} />
            ))}
          </datalist>

          {cart.length > 0 && (
            <div className="space-y-2 mb-3">
              {cart.map((line, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{line.product_name}</span>
                    <button onClick={() => removeLine(idx)} className="text-slate-300 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                      className="w-14 px-2 py-1 border border-slate-200 rounded text-sm text-right"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={line.unit_price}
                      onChange={(e) => updateLine(idx, { unit_price: Number(e.target.value) })}
                      className="w-24 px-2 py-1 border border-slate-200 rounded text-sm text-right"
                    />
                    <div className="flex gap-1 ml-auto">
                      <button
                        onClick={() => updateLine(idx, { item_type: "core" })}
                        className={`px-2 py-1 rounded text-xs border ${line.item_type === "core" ? "bg-slate-900 text-white border-slate-900" : "border-slate-300"}`}
                      >
                        Core
                      </button>
                      <button
                        onClick={() => updateLine(idx, { item_type: "accessory" })}
                        className={`px-2 py-1 rounded text-xs border ${line.item_type === "accessory" ? "bg-slate-900 text-white border-slate-900" : "border-slate-300"}`}
                      >
                        Accessory
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="text-slate-500">Total</span>
            <span className="font-semibold">
              {cartTotal.toLocaleString("de-DE")} {currency}
            </span>
          </div>

          <button
            onClick={completeSale}
            disabled={saving || cart.length === 0}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Complete sale"}
          </button>
        </div>
      )}
    </div>
  );
}
