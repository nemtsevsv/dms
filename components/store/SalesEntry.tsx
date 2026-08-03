"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, Trash2, X } from "lucide-react";

type Product = { sku: string; product_name: string; local_price: number };

type CartLine = { sku: string; product_name: string; quantity: number; unit_price: number; item_type: "core" | "accessory" };

type SoldItem = {
  itemId: string;
  createdBy: string | null;
  sku: string | null;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  itemType: string;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default function SalesEntry({
  storeId,
  reportDate,
  products,
  currency,
  todayReceiptsCount,
  todaySalesTotal,
  todayCoreTotal,
  todayAccessoriesTotal,
  dailyTarget,
  soldItemsToday,
  isAdmin,
}: {
  storeId: string;
  reportDate: string;
  products: Product[];
  currency: string;
  todayReceiptsCount: number;
  todaySalesTotal: number;
  todayCoreTotal: number;
  todayAccessoriesTotal: number;
  dailyTarget: number;
  soldItemsToday: SoldItem[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

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
  const achievementPct = dailyTarget > 0 ? Math.round((todaySalesTotal / dailyTarget) * 100) : 0;

  async function completeSale() {
    if (cart.length === 0) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: receipt } = await supabase
      .from("store_receipts")
      .insert({ store_id: storeId, occurred_at: `${reportDate}T12:00:00Z`, created_by: user?.email ?? null })
      .select()
      .single();
    if (receipt) {
      await supabase.from("store_receipt_items").insert(
        cart.map((l) => ({
          receipt_id: receipt.id,
          sku: l.sku,
          product_name: l.product_name,
          quantity: l.quantity,
          unit_price: l.unit_price,
          total: round2(l.quantity * l.unit_price),
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
          occurred_at: `${reportDate}T12:00:00Z`,
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

  // Admin-only corrections. Inventory is adjusted by the delta via a
  // separate 'adjustment' movement rather than touching the original sale
  // record, so the sale history stays an honest log of what actually happened.
  async function adminUpdateItem(item: SoldItem, patch: Partial<{ quantity: number; unitPrice: number }>) {
    const newQty = patch.quantity ?? item.quantity;
    const newPrice = patch.unitPrice ?? item.unitPrice;
    const newTotal = round2(newQty * newPrice);
    await supabase.from("store_receipt_items").update({ quantity: newQty, unit_price: newPrice, total: newTotal }).eq("id", item.itemId);

    const qtyDelta = newQty - item.quantity;
    if (qtyDelta !== 0 && item.sku) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase.from("store_stock_movements").insert({
        store_id: storeId,
        sku: item.sku,
        product_name: item.productName,
        type: "adjustment",
        quantity: -qtyDelta,
        occurred_at: `${reportDate}T12:00:00Z`,
        created_by: user?.email ?? null,
        note: "Correction to a sold item (admin edit)",
      });
    }
    router.refresh();
  }

  async function adminDeleteItem(item: SoldItem) {
    await supabase.from("store_receipt_items").delete().eq("id", item.itemId);
    if (item.sku && item.quantity > 0) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase.from("store_stock_movements").insert({
        store_id: storeId,
        sku: item.sku,
        product_name: item.productName,
        type: "adjustment",
        quantity: item.quantity,
        occurred_at: `${reportDate}T12:00:00Z`,
        created_by: user?.email ?? null,
        note: "Sold item removed (admin edit) — stock returned",
      });
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Sold Items — searchable entry, feeds Sales Result and inventory automatically */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Sold items</h2>
          {!open && <span className="text-sm text-slate-500">{todayReceiptsCount} receipts today</span>}
        </div>

        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 md:py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
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
              className="w-full py-3 md:py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Complete sale"}
            </button>
          </div>
        )}
      </div>

      {/* Sold items today — read-only list for sellers, editable for admin */}
      {soldItemsToday.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h2 className="font-medium mb-3">Sold items today</h2>
          <div className="space-y-2">
            {soldItemsToday.map((item) => (
              <div key={item.itemId} className="flex items-center justify-between gap-2 text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <div className="font-medium truncate">{item.productName}</div>
                  <div className="text-xs text-slate-400">{item.itemType} · entered by {item.createdBy ?? "—"}</div>
                </div>
                {isAdmin ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min={0}
                      defaultValue={item.quantity}
                      onBlur={(e) => adminUpdateItem(item, { quantity: Number(e.target.value) })}
                      className="w-14 px-1.5 py-1 border border-slate-200 rounded text-right text-xs"
                    />
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={item.unitPrice}
                      onBlur={(e) => adminUpdateItem(item, { unitPrice: Number(e.target.value) })}
                      className="w-20 px-1.5 py-1 border border-slate-200 rounded text-right text-xs"
                    />
                    <button onClick={() => adminDeleteItem(item)} className="text-slate-300 hover:text-red-600 px-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="text-right shrink-0">
                    <div className="font-medium">
                      {item.quantity} × {item.unitPrice.toLocaleString("de-DE")}
                    </div>
                    <div className="text-xs text-slate-400">
                      {item.total.toLocaleString("de-DE")} {currency}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {!isAdmin && <p className="text-xs text-slate-400 mt-3">Only an admin can edit or remove a sold item.</p>}
        </div>
      )}

      {/* Sales Result — automatically computed from Sold Items above */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <h2 className="font-medium mb-3">Sales result</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-400">Receipts</div>
            <div className="text-lg font-semibold">{todayReceiptsCount}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Sales total</div>
            <div className="text-lg font-semibold">
              {todaySalesTotal.toLocaleString("de-DE")} {currency}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Core products</div>
            <div className="font-medium">
              {todayCoreTotal.toLocaleString("de-DE")} {currency}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Accessories</div>
            <div className="font-medium">
              {todayAccessoriesTotal.toLocaleString("de-DE")} {currency}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Target</div>
            <div className="font-medium">
              {dailyTarget.toLocaleString("de-DE")} {currency}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Target achievement</div>
            <div className={`font-medium ${achievementPct >= 100 ? "text-emerald-600" : "text-slate-700"}`}>{achievementPct}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
