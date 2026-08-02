"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Product = { sku: string; product_name: string; retail_price_incl_vat: number | null };
type Override = { sku: string; local_price: number };

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default function StorePriceOverrides({
  storeId,
  products,
  overrides,
  fxRate,
  currency,
}: {
  storeId: string;
  products: Product[];
  overrides: Override[];
  fxRate: number;
  currency: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});

  const overrideMap = new Map(overrides.map((o) => [o.sku, o.local_price]));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => p.sku.toLowerCase().includes(q) || p.product_name.toLowerCase().includes(q));
  }, [products, search]);

  async function saveOverride(sku: string, value: string) {
    const num = Number(value.replace(",", "."));
    if (!num || num <= 0) {
      await supabase.from("store_price_overrides").delete().eq("store_id", storeId).eq("sku", sku);
    } else {
      await supabase.from("store_price_overrides").upsert(
        { store_id: storeId, sku, local_price: round2(num), updated_at: new Date().toISOString() },
        { onConflict: "store_id,sku" }
      );
    }
    setEditing((e) => {
      const next = { ...e };
      delete next[sku];
      return next;
    });
    router.refresh();
  }

  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">
        Default price = Retail Price incl. VAT × FX rate ({fxRate}). Only set a value below to override a specific item —
        clear it to go back to the computed default.
      </p>
      <input
        placeholder="Search by Order-No. or name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-72 mb-3"
      />
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Order-No.</th>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-right px-4 py-3">Computed ({currency})</th>
              <th className="text-right px-4 py-3">Override ({currency})</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((p) => {
              const computed = round2((p.retail_price_incl_vat ?? 0) * fxRate);
              const override = overrideMap.get(p.sku);
              return (
                <tr key={p.sku} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.sku}</td>
                  <td className="px-4 py-3">{p.product_name}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{computed.toLocaleString("de-DE")}</td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={String(computed)}
                      defaultValue={override !== undefined ? String(override) : ""}
                      onBlur={(e) => {
                        if (e.target.value.trim() !== String(override ?? "")) saveOverride(p.sku, e.target.value);
                      }}
                      className="w-28 px-2 py-1 border border-slate-200 rounded text-right"
                    />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-400">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > 200 && <p className="text-xs text-slate-400 mt-2">Showing first 200 results — refine your search for more.</p>}
    </div>
  );
}
