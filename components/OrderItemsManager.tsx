"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { computeItemStatus } from "@/lib/orderItemStatus";
import { Trash2 } from "lucide-react";

type Item = {
  id: string;
  sku: string | null;
  product_name: string | null;
  quantity: number | null;
  list_price: number | null;
  dealer_discount_percent: number | null;
  unit_price: number | null;
  total: number | null;
};

type Product = {
  sku: string;
  product_name: string;
  list_price: number | null;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default function OrderItemsManager({
  orderId,
  orderStatus,
  items,
  invoicedQtyByItem,
  currency,
  products,
  dealerDiscount,
}: {
  orderId: string;
  orderStatus: string;
  items: Item[];
  invoicedQtyByItem: Record<string, number>;
  currency: string;
  products: Product[];
  dealerDiscount: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  const [newItem, setNewItem] = useState({
    search: "",
    sku: "",
    product_name: "",
    quantity: 1,
    list_price: 0,
    discount: dealerDiscount,
  });

  function findProduct(term: string): Product | undefined {
    const t = term.trim().toLowerCase();
    return products.find((p) => p.sku.toLowerCase() === t) || products.find((p) => `${p.sku} — ${p.product_name}`.toLowerCase() === t);
  }

  function handleSearchChange(value: string) {
    const product = findProduct(value);
    if (product) {
      setNewItem((f) => ({
        ...f,
        search: `${product.sku} — ${product.product_name}`,
        sku: product.sku,
        product_name: product.product_name,
        list_price: product.list_price ?? 0,
      }));
    } else {
      setNewItem((f) => ({ ...f, search: value, sku: "", product_name: value }));
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.product_name.trim()) return;
    setSaving(true);
    const dealerPrice = round2(newItem.list_price * (1 - newItem.discount / 100));
    const total = round2(newItem.quantity * dealerPrice);
    await supabase.from("order_items").insert({
      order_id: orderId,
      sku: newItem.sku,
      product_name: newItem.product_name,
      quantity: newItem.quantity,
      list_price: newItem.list_price,
      dealer_discount_percent: newItem.discount,
      unit_price: dealerPrice,
      total,
    });
    setNewItem({ search: "", sku: "", product_name: "", quantity: 1, list_price: 0, discount: dealerDiscount });
    setSaving(false);
    router.refresh();
  }

  async function updateItem(item: Item, patch: Partial<Item>) {
    const merged = { ...item, ...patch };
    const listPrice = Number(merged.list_price) || 0;
    const discount = Number(merged.dealer_discount_percent) || 0;
    const qty = Number(merged.quantity) || 0;
    const dealerPrice = round2(listPrice * (1 - discount / 100));
    const total = round2(qty * dealerPrice);
    await supabase
      .from("order_items")
      .update({
        sku: merged.sku,
        product_name: merged.product_name,
        quantity: qty,
        list_price: listPrice,
        dealer_discount_percent: discount,
        unit_price: dealerPrice,
        total,
      })
      .eq("id", item.id);
    router.refresh();
  }

  async function deleteItem(itemId: string) {
    await supabase.from("order_items").delete().eq("id", itemId);
    router.refresh();
  }

  const rows = items.map((i) => {
    const status = computeItemStatus(Number(i.quantity) || 0, invoicedQtyByItem[i.id] ?? 0, orderStatus);
    return { ...i, status };
  });

  const totalActive = rows.filter((i) => i.status.label !== "Cancelled").reduce((s, i) => s + (Number(i.total) || 0), 0);
  const totalInvoiced = rows.reduce((s, i) => s + (Number(i.total) || 0) * (i.status.invoicedQty / (Number(i.quantity) || 1)), 0);
  const totalWaiting = rows.reduce((s, i) => s + i.status.waitingQty * (Number(i.unit_price) || 0), 0);

  const inputCls = "px-2 py-1.5 border border-slate-200 rounded text-sm w-full";

  return (
    <div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm mb-4">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-3 w-10">#</th>
              <th className="text-left px-3 py-3">Order-No.</th>
              <th className="text-left px-3 py-3">Product</th>
              <th className="text-right px-3 py-3">Qty</th>
              <th className="text-right px-3 py-3">List Price</th>
              <th className="text-right px-3 py-3">Discount %</th>
              <th className="text-right px-3 py-3">Dealer Price</th>
              <th className="text-right px-3 py-3">Total</th>
              <th className="text-left px-3 py-3">Status</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i, idx) => (
              <tr key={i.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  <input className={inputCls} defaultValue={i.sku ?? ""} onBlur={(e) => updateItem(i, { sku: e.target.value })} />
                </td>
                <td className="px-3 py-2">
                  <input className={inputCls} defaultValue={i.product_name ?? ""} onBlur={(e) => updateItem(i, { product_name: e.target.value })} />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    className={inputCls + " text-right"}
                    defaultValue={i.quantity ?? 0}
                    onBlur={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    className={inputCls + " text-right"}
                    defaultValue={i.list_price ?? ""}
                    onBlur={(e) => updateItem(i, { list_price: Number(e.target.value) })}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.1"
                    className={inputCls + " text-right"}
                    defaultValue={i.dealer_discount_percent ?? 0}
                    onBlur={(e) => updateItem(i, { dealer_discount_percent: Number(e.target.value) })}
                  />
                </td>
                <td className="px-3 py-2 text-right text-slate-600">{i.unit_price?.toLocaleString("de-DE")}</td>
                <td className="px-3 py-2 text-right font-medium">{i.total?.toLocaleString("de-DE")}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs font-medium rounded-full px-2 py-1 whitespace-nowrap ${i.status.colorClass}`}>{i.status.label}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => deleteItem(i.id)} className="text-slate-300 hover:text-red-600" aria-label="Delete item">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}

            {/* Add new item row */}
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td className="px-3 py-2 text-slate-400">+</td>
              <td className="px-3 py-2" colSpan={2}>
                <input
                  list="products-datalist"
                  placeholder="Search Order-No. or product name..."
                  className={inputCls}
                  value={newItem.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                <datalist id="products-datalist">
                  {products.map((p) => (
                    <option key={p.sku} value={`${p.sku} — ${p.product_name}`} />
                  ))}
                </datalist>
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  className={inputCls + " text-right"}
                  value={newItem.quantity}
                  onChange={(e) => setNewItem((f) => ({ ...f, quantity: Number(e.target.value) }))}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  step="0.01"
                  className={inputCls + " text-right"}
                  value={newItem.list_price}
                  onChange={(e) => setNewItem((f) => ({ ...f, list_price: Number(e.target.value) }))}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  step="0.1"
                  className={inputCls + " text-right"}
                  value={newItem.discount}
                  onChange={(e) => setNewItem((f) => ({ ...f, discount: Number(e.target.value) }))}
                />
              </td>
              <td className="px-3 py-2 text-right text-slate-500">
                {round2(newItem.list_price * (1 - newItem.discount / 100)).toLocaleString("de-DE")}
              </td>
              <td className="px-3 py-2 text-right text-slate-500">
                {round2(newItem.quantity * newItem.list_price * (1 - newItem.discount / 100)).toLocaleString("de-DE")}
              </td>
              <td className="px-3 py-2" colSpan={2}>
                <button
                  onClick={addItem}
                  disabled={saving || !newItem.product_name.trim()}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs hover:bg-slate-800 disabled:opacity-50"
                >
                  + Add Item
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-4 sm:gap-6 text-sm bg-slate-50 border border-slate-200 rounded-xl px-5 py-3">
        <div>
          Total (excl. cancelled): <span className="font-semibold">{totalActive.toLocaleString("de-DE")} {currency}</span>
        </div>
        <div className="text-emerald-700">
          Invoiced value: <span className="font-semibold">{round2(totalInvoiced).toLocaleString("de-DE")} {currency}</span>
        </div>
        <div className="text-amber-700">
          Waiting value: <span className="font-semibold">{round2(totalWaiting).toLocaleString("de-DE")} {currency}</span>
        </div>
      </div>
    </div>
  );
}
