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
  customs_tariff_no: string | null;
  country_of_origin: string | null;
  serial_number: string | null;
};

type OrderItem = {
  id: string;
  sku: string | null;
  product_name: string | null;
  unit_price: number | null;
  remaining: number;
  customs_tariff_no: string | null;
  country_of_origin: string | null;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default function InvoiceItemsManager({
  invoiceId,
  items,
  currency,
  orderItems,
}: {
  invoiceId: string;
  items: Item[];
  currency: string;
  orderItems: OrderItem[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [justSaved, setJustSaved] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickable = orderItems.filter((oi) => oi.remaining > 0);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<OrderItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [customsTariffNo, setCustomsTariffNo] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  async function updateItem(id: string, field: string, value: number | string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const isTextField = field === "customs_tariff_no" || field === "country_of_origin" || field === "serial_number";
    if (isTextField) {
      await supabase.from("invoice_items").update({ [field]: (value as string) || null }).eq("id", id);
    } else {
      const updated = { ...item, [field]: value };
      const total = (Number(updated.quantity) || 0) * (Number(updated.unit_price) || 0);
      await supabase.from("invoice_items").update({ [field]: value, total }).eq("id", id);
    }
    setJustSaved(true);
    router.refresh();
    setTimeout(() => setJustSaved(false), 2000);
  }

  async function deleteItem(id: string) {
    await supabase.from("invoice_items").delete().eq("id", id);
    router.refresh();
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    const t = value.trim().toLowerCase();
    const match = pickable.find((oi) => oi.sku?.toLowerCase() === t || `${oi.sku} — ${oi.product_name}`.toLowerCase() === t);
    if (match) {
      setSelected(match);
      setSearch(`${match.sku} — ${match.product_name}`);
      setQuantity(match.remaining);
      setUnitPrice(match.unit_price ?? 0);
      setCustomsTariffNo(match.customs_tariff_no ?? "");
      setCountryOfOrigin(match.country_of_origin ?? "");
      setSerialNumber("");
    } else {
      setSelected(null);
    }
  }

  async function addItem() {
    setError(null);
    if (!selected) {
      setError("Pick an Order-No. that already exists on this order first.");
      return;
    }
    if (quantity <= 0 || quantity > selected.remaining) {
      setError(`Quantity must be between 1 and ${selected.remaining} (the remaining un-invoiced quantity for this item).`);
      return;
    }
    setAdding(true);
    const total = round2(quantity * unitPrice);
    await supabase.from("invoice_items").insert({
      invoice_id: invoiceId,
      order_item_id: selected.id,
      sku: selected.sku,
      product_name: selected.product_name,
      quantity,
      unit_price: unitPrice,
      total,
      customs_tariff_no: customsTariffNo || null,
      country_of_origin: countryOfOrigin || null,
      serial_number: serialNumber || null,
    });
    setSearch("");
    setSelected(null);
    setQuantity(1);
    setUnitPrice(0);
    setCustomsTariffNo("");
    setCountryOfOrigin("");
    setSerialNumber("");
    setAdding(false);
    router.refresh();
  }

  const total = items.reduce((s, i) => s + (Number(i.total) || 0), 0);
  const inputCls = "px-2 py-1.5 border border-slate-200 rounded text-sm w-full";

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
        <table className="w-full text-sm min-w-[950px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Order-No.</th>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">Customs Tariff No.</th>
              <th className="text-left px-4 py-3">Country of Origin</th>
              <th className="text-left px-4 py-3">Serial Number</th>
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
                <td className="px-4 py-3">
                  <input
                    defaultValue={i.customs_tariff_no ?? ""}
                    onBlur={(e) => updateItem(i.id, "customs_tariff_no", e.target.value)}
                    className="w-32 px-2 py-1 border border-slate-200 rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    defaultValue={i.country_of_origin ?? ""}
                    onBlur={(e) => updateItem(i.id, "country_of_origin", e.target.value)}
                    className="w-28 px-2 py-1 border border-slate-200 rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    defaultValue={i.serial_number ?? ""}
                    onBlur={(e) => updateItem(i.id, "serial_number", e.target.value)}
                    className="w-28 px-2 py-1 border border-slate-200 rounded"
                  />
                </td>
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

            {pickable.length > 0 && (
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td className="px-3 py-2" colSpan={2}>
                  <input
                    list="invoice-order-items-datalist"
                    placeholder="Search Order-No. or product from this order..."
                    className={inputCls}
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                  <datalist id="invoice-order-items-datalist">
                    {pickable.map((oi) => (
                      <option key={oi.id} value={`${oi.sku} — ${oi.product_name}`}>
                        {`remaining: ${oi.remaining}`}
                      </option>
                    ))}
                  </datalist>
                </td>
                <td className="px-3 py-2">
                  <input className={inputCls} placeholder="auto" value={customsTariffNo} onChange={(e) => setCustomsTariffNo(e.target.value)} />
                </td>
                <td className="px-3 py-2">
                  <input className={inputCls} placeholder="auto" value={countryOfOrigin} onChange={(e) => setCountryOfOrigin(e.target.value)} />
                </td>
                <td className="px-3 py-2">
                  <input className={inputCls} value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    max={selected?.remaining ?? undefined}
                    className={inputCls + " text-right"}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    className={inputCls + " text-right"}
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                  />
                </td>
                <td className="px-3 py-2 text-right text-slate-500">{round2(quantity * unitPrice).toLocaleString("de-DE")}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={addItem}
                    disabled={adding || !selected}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs hover:bg-slate-800 disabled:opacity-50"
                  >
                    + Add
                  </button>
                </td>
              </tr>
            )}

            {items.length === 0 && pickable.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-4 text-slate-400 text-xs">
                  Nothing to invoice yet — add items to the order first, then come back here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {pickable.length === 0 && items.length > 0 && (
        <p className="text-xs text-slate-400 mb-3">
          Every item on the linked order is already fully invoiced — add more items to the order to invoice them.
        </p>
      )}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm">
        Total: <span className="font-semibold">{total.toLocaleString("de-DE")} {currency}</span>
      </div>
    </div>
  );
}
