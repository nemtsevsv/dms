"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";

type Product = { sku: string; product_name: string; list_price: number | null };

type PreviewRow = {
  sku: string;
  product_name: string | null;
  quantity: number;
  list_price: number | null;
  matched: boolean;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// "6.100,00" -> 6100 (European format: "." thousands separator, "," decimal)
function parseEuropeanNumber(s: string): number {
  if (!s) return 0;
  return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
}

// Simple format used by our own template: "0,00" or "1200.50"
function parseSimpleNumber(s: string): number {
  if (!s) return 0;
  return Number(s.replace(",", ".")) || 0;
}

const HEADER_WORDS = ["order-no.", "order-no", "sku"];

type ParsedLine = { sku: string; product: string; qtyRaw: string; priceRaw: string; european: boolean };

function parseLine(line: string): ParsedLine {
  const tabParts = line.split("\t").map((p) => p.trim());

  // Leica / distributor price-list export pasted straight from Excel:
  // Order-No. | flag(n/e/p/d) | Description | Description | RSP incl. VAT | EAN | List Price | SN | (blank) | (blank) | Order Quantity
  if (tabParts.length >= 9) {
    return {
      sku: tabParts[0] ?? "",
      product: tabParts[2] ?? "",
      priceRaw: tabParts[6] ?? "",
      qtyRaw: tabParts[tabParts.length - 1] ?? "",
      european: true,
    };
  }

  // Our own simple format: "Order-No. Qty" separated by a space, e.g. "10302 5"
  const spaceParts = line.trim().split(/\s+/);
  const [sku = "", qty = ""] = spaceParts;
  return { sku, product: "", qtyRaw: qty, priceRaw: "", european: false };
}

export default function BulkAddItems({
  orderId,
  products,
  dealerDiscount,
  onDone,
}: {
  orderId: string;
  products: Product[];
  dealerDiscount: number;
  onDone: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [saving, setSaving] = useState(false);

  const productBySku = new Map(products.map((p) => [p.sku.toLowerCase(), p]));

  function buildPreview() {
    const rows: PreviewRow[] = [];
    for (const rawLine of text.split("\n")) {
      const line = rawLine.trim();
      if (!line) continue;

      const { sku: skuRaw, product: productRaw, qtyRaw, priceRaw, european } = parseLine(line);
      const sku = skuRaw.trim();
      if (!sku) continue;
      if (HEADER_WORDS.includes(sku.toLowerCase())) continue; // skip a pasted header row

      const parseNum = european ? parseEuropeanNumber : parseSimpleNumber;
      const quantity = parseNum(qtyRaw);
      if (!quantity) continue; // section headers / subtotal rows in price-list exports have no quantity

      const match = productBySku.get(sku.toLowerCase());
      const listPrice = priceRaw && priceRaw.trim() ? parseNum(priceRaw) : match?.list_price ?? null;
      const productName = productRaw && productRaw.trim() ? productRaw.trim() : match?.product_name ?? null;
      rows.push({ sku, product_name: productName, quantity, list_price: listPrice, matched: !!match });
    }
    setPreview(rows);
  }

  async function confirmAdd() {
    if (!preview || preview.length === 0) return;
    setSaving(true);
    const rows = preview.map((r) => {
      const listPrice = r.list_price ?? 0;
      const unit_price = round2(listPrice * (1 - dealerDiscount / 100));
      return {
        order_id: orderId,
        sku: r.sku,
        product_name: r.product_name,
        quantity: r.quantity,
        list_price: r.list_price,
        dealer_discount_percent: dealerDiscount,
        unit_price,
        total: round2(r.quantity * unit_price),
      };
    });
    await supabase.from("order_items").insert(rows);
    setSaving(false);
    setText("");
    setPreview(null);
    router.refresh();
    onDone();
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Paste a list of items</h3>
        <button
          onClick={() => {
            setPreview(null);
            setText("");
            onDone();
          }}
          className="text-slate-400 hover:text-slate-700"
        >
          <X size={16} />
        </button>
      </div>
      <p className="text-xs text-slate-500 mb-2">
        Two formats are supported — just paste as-is, no need to reformat:
      </p>
      <ul className="text-xs text-slate-500 mb-2 list-disc pl-4 space-y-0.5">
        <li>
          <strong>Simple list</strong>: <code>Order-No. Qty</code>, separated by a space — one item per line, e.g.{" "}
          <code>10302 5</code>. Product name and List Price are pulled automatically from the Products catalog by Order-No.;
          if a match isn't found, those fields are left blank for you to fill in manually in the table below.
        </li>
        <li>
          <strong>Distributor price-list order export</strong> (e.g. the Leica order sheet): select and copy the data rows
          (Order-No. through Order Quantity) straight from Excel and paste them here — it's recognized automatically.
        </li>
      </ul>
      <textarea
        rows={6}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setPreview(null);
        }}
        placeholder={"10302 5\n10370 1\n11826 2"}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono mb-2"
      />
      {!preview ? (
        <button
          onClick={buildPreview}
          disabled={!text.trim()}
          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          Preview
        </button>
      ) : (
        <div>
          <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto mb-3">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-500 uppercase">
                <tr>
                  <th className="text-left px-2 py-1.5">Order-No.</th>
                  <th className="text-left px-2 py-1.5">Product</th>
                  <th className="text-right px-2 py-1.5">Qty</th>
                  <th className="text-right px-2 py-1.5">List Price</th>
                  <th className="text-left px-2 py-1.5">Catalog Match</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="px-2 py-1.5 font-mono">{r.sku}</td>
                    <td className="px-2 py-1.5">{r.product_name ?? <span className="text-slate-300">— fill in manually</span>}</td>
                    <td className="px-2 py-1.5 text-right">{r.quantity}</td>
                    <td className="px-2 py-1.5 text-right">
                      {r.list_price !== null ? r.list_price.toLocaleString("de-DE") : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-2 py-1.5">
                      {r.matched ? (
                        <span className="text-emerald-600">Found</span>
                      ) : (
                        <span className="text-amber-600">Not found — fill in manually</span>
                      )}
                    </td>
                  </tr>
                ))}
                {preview.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-slate-400">
                      No valid rows found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button
              onClick={confirmAdd}
              disabled={saving || preview.length === 0}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Adding..." : `Add ${preview.length} item${preview.length === 1 ? "" : "s"}`}
            </button>
            <button onClick={() => setPreview(null)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-100">
              Edit list
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
