"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";
import { Upload, Download } from "lucide-react";
import { btnNeutral, btnImport } from "@/lib/buttonStyles";

function normalizeKey(k: string) {
  return k.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const FIELD_MAP: Record<string, string> = {
  sku: "sku",
  orderno: "sku",
  ordernumber: "sku",
  brand: "brand",
  group: "group_name",
  category: "category",
  subcategory: "subgroup",
  subgroup: "subgroup",
  productname: "product_name",
  name: "product_name",
  listprice: "list_price",
  retailpriceinclvat: "retail_price_incl_vat",
  retailprice: "retail_price_incl_vat",
  retailpriceincvat: "retail_price_incl_vat",
  dealerprice: "dealer_price",
};

function parsePrice(v: any): number {
  if (v === undefined || v === null || v === "") return 0;
  return Number(String(v).replace(",", ".")) || 0;
}

export default function ProductImport() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number; errors: string[] } | null>(null);

  function downloadTemplate() {
    const header = ["Brand", "Group", "Category", "Sub-Category", "Order-No.", "Name", "List Price", "Retail Price incl VAT"];
    const example = ["Example Brand", "Example Group", "Photo", "Cameras", "10001", "Example Product Name", "0,00", "0,00"];
    const csv = [header, example].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products-import-template.csv";
    a.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, string>[];
        const errors: string[] = [];
        const parsedRows: Record<string, any>[] = [];
        const skus: string[] = [];

        for (const row of rows) {
          const mapped: Record<string, any> = {};
          for (const key of Object.keys(row)) {
            const field = FIELD_MAP[normalizeKey(key)];
            if (field) mapped[field] = row[key];
          }
          if (!mapped.sku || !String(mapped.sku).trim()) {
            errors.push(`Row skipped: missing Order-No. (${JSON.stringify(row)})`);
            continue;
          }
          mapped.sku = String(mapped.sku).trim();
          if (mapped.list_price !== undefined) mapped.list_price = parsePrice(mapped.list_price);
          if (mapped.retail_price_incl_vat !== undefined) mapped.retail_price_incl_vat = parsePrice(mapped.retail_price_incl_vat);
          if (mapped.dealer_price !== undefined) mapped.dealer_price = parsePrice(mapped.dealer_price);
          parsedRows.push(mapped);
          skus.push(mapped.sku);
        }

        if (parsedRows.length === 0) {
          setResult({ created: 0, updated: 0, skipped: rows.length, errors });
          setImporting(false);
          return;
        }

        const { data: existing } = await supabase.from("products").select("sku, product_name").in("sku", skus);
        const existingMap = new Map((existing ?? []).map((p: any) => [p.sku, p.product_name]));

        const finalRows: Record<string, any>[] = parsedRows.map((r) => ({
          ...r,
          product_name: r.product_name ?? existingMap.get(r.sku) ?? r.sku,
        }));

        const createdCount = finalRows.filter((r) => !existingMap.has(r.sku)).length;
        const updatedCount = finalRows.length - createdCount;

        const { error } = await supabase.from("products").upsert(finalRows, { onConflict: "sku" });
        if (error) errors.push(error.message);

        setResult({ created: createdCount, updated: updatedCount, skipped: rows.length - parsedRows.length, errors });
        setImporting(false);
        router.refresh();
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      error: (err) => {
        setResult({ created: 0, updated: 0, skipped: 0, errors: [err.message] });
        setImporting(false);
      },
    });
  }

  return (
    <>
      <button onClick={downloadTemplate} type="button" className={btnNeutral}>
        <Download size={14} />
        Template
      </button>
      <label className={btnImport + " cursor-pointer"}>
        <Upload size={14} />
        {importing ? "Importing..." : "Import"}
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFile} className="hidden" disabled={importing} />
      </label>
      {result && (
        <div className="basis-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p>
            Created: <span className="font-medium text-emerald-700">{result.created}</span> · Updated:{" "}
            <span className="font-medium text-blue-700">{result.updated}</span> · Skipped:{" "}
            <span className="font-medium text-slate-500">{result.skipped}</span>
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-1 text-xs text-red-600 list-disc pl-4">
              {result.errors.slice(0, 5).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
