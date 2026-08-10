"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Plus } from "lucide-react";

type HsCode = { id: string; product_group: string; product: string; hs_code: string; eurostat_api: boolean };

export default function HsCodesTable({ codes }: { codes: HsCode[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [newRow, setNewRow] = useState({ product_group: "", product: "", hs_code: "" });
  const [saving, setSaving] = useState(false);

  async function toggleChecked(id: string, current: boolean) {
    await supabase.from("hs_codes").update({ eurostat_api: !current }).eq("id", id);
    router.refresh();
  }

  async function deleteRow(id: string) {
    await supabase.from("hs_codes").delete().eq("id", id);
    router.refresh();
  }

  async function addRow() {
    if (!newRow.hs_code.trim()) return;
    setSaving(true);
    await supabase.from("hs_codes").insert({
      product_group: newRow.product_group.trim() || null,
      product: newRow.product.trim() || null,
      hs_code: newRow.hs_code.trim(),
      eurostat_api: true,
    });
    setNewRow({ product_group: "", product: "", hs_code: "" });
    setSaving(false);
    router.refresh();
  }

  const inputCls = "px-2 py-1 border border-slate-200 rounded text-sm w-full";

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left px-3 py-2.5">Product Group</th>
            <th className="text-left px-3 py-2.5">Product</th>
            <th className="text-left px-3 py-2.5">HS Code</th>
            <th className="text-center px-3 py-2.5">Eurostat API</th>
            <th className="px-3 py-2.5"></th>
          </tr>
        </thead>
        <tbody>
          {codes.map((c) => (
            <tr key={c.id} className="border-t border-slate-100">
              <td className="px-3 py-2 text-slate-700">{c.product_group}</td>
              <td className="px-3 py-2 text-slate-700">{c.product}</td>
              <td className="px-3 py-2 text-slate-500 font-mono text-xs">{c.hs_code}</td>
              <td className="px-3 py-2 text-center">
                <input type="checkbox" checked={c.eurostat_api} onChange={() => toggleChecked(c.id, c.eurostat_api)} />
              </td>
              <td className="px-3 py-2 text-right">
                <button onClick={() => deleteRow(c.id)} className="text-slate-300 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
          <tr className="border-t border-slate-200 bg-slate-50">
            <td className="px-3 py-2">
              <input className={inputCls} placeholder="e.g. Sport Optics" value={newRow.product_group} onChange={(e) => setNewRow((r) => ({ ...r, product_group: e.target.value }))} />
            </td>
            <td className="px-3 py-2">
              <input className={inputCls} placeholder="e.g. Binoculars" value={newRow.product} onChange={(e) => setNewRow((r) => ({ ...r, product: e.target.value }))} />
            </td>
            <td className="px-3 py-2">
              <input className={inputCls} placeholder="8-digit code" value={newRow.hs_code} onChange={(e) => setNewRow((r) => ({ ...r, hs_code: e.target.value }))} />
            </td>
            <td className="px-3 py-2 text-center text-slate-300">—</td>
            <td className="px-3 py-2 text-right">
              <button onClick={addRow} disabled={saving} className="text-emerald-600 hover:text-emerald-800 disabled:opacity-50">
                <Plus size={16} />
              </button>
            </td>
          </tr>
          {codes.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-8 text-slate-400">
                No HS codes yet — add one above
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
