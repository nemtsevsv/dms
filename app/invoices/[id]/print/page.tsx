import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import { format } from "date-fns";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function amountFmt(n: number) {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Browsers suggest the page's <title> as the filename when "Save as PDF"
// is chosen from the print dialog (this page has no server-generated PDF
// file of its own — printing IS the PDF creation step) — so the filename
// requested ("Invoice number Invoice date Dealer Name") is set here.
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data: invoice } = await supabase.from("invoices").select("invoice_number, invoice_date, dealers(company_name)").eq("id", params.id).single();
  if (!invoice) return {};
  const dateStr = format(new Date(invoice.invoice_date), "dd.MM.yyyy");
  const dealerName = (invoice as any).dealers?.company_name ?? "";
  return { title: [invoice.invoice_number, dateStr, dealerName].filter(Boolean).join(" ") };
}

export default async function InvoicePrintPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, dealers(*), orders(order_number)")
    .eq("id", params.id)
    .single();
  if (!invoice) notFound();

  const { data: items } = await supabase.from("invoice_items").select("*").eq("invoice_id", params.id);
  const itemsTotal = (items ?? []).reduce((s, i) => s + (Number(i.total) || 0), 0);
  // Freight Charges has no dedicated field yet — the Purchase tab's
  // Logistic DE-MN/MN-XX figures are internal cost data, deliberately not
  // shown to the dealer. Defaults to 0 until a customer-facing freight
  // amount is added to the invoice.
  const freightCharges = 0;
  const vatRate = 0;
  const vatAmount = round2(itemsTotal * vatRate);
  const finalAmount = round2(itemsTotal + freightCharges + vatAmount);
  const dealer = invoice.dealers;

  return (
    <div className="min-h-screen bg-white text-slate-800 p-10 max-w-3xl mx-auto text-sm">
      <PrintButton />

      <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-slate-800">
        <div>
          <h1 className="text-lg font-bold mb-1">CAPOF MN LLC</h1>
          <p className="text-xs leading-relaxed text-slate-600">
            Ulaanbaatar city, Sukhbaatar district, 1st khoroo.
            <br />
            Olympics street, 19c, 20th floor, Room 9
            <br />
            11000 – ULAANBAATAR, MONGOLIA
            <br />
            <br />
            Capof MN LLC – GOLOMT BANK
            <br />
            EURO ACCOUNT – 3205139826
            <br />
            Official Distributor Central Asia
            <br />
            SWIFT CODE – GLMTMNUB
            <br />
            <br />
            No: {invoice.invoice_number} Date: {format(new Date(invoice.invoice_date), "dd.MM.yyyy")}
            {invoice.orders?.order_number && <> | Order: {invoice.orders.order_number}</>}
            <br />
            Terms of delivery: CIP &quot;{dealer?.city || ""}&quot;
          </p>
        </div>
        <div className="text-right">
          <img src="/capof-badge.png" alt="CAPOF" className="h-8 w-auto ml-auto mb-2" />
          <img src="/leica-badge.png" alt="Leica" className="h-8 w-8 ml-auto rounded-full" />
        </div>
      </div>

      <div className="mb-8">
        <p className="text-xs uppercase text-slate-400 mb-1">Invoice to</p>
        <p className="font-semibold">{dealer?.company_name}</p>
        {dealer?.address && <p>{dealer.address}</p>}
        <p>
          {[dealer?.city, dealer?.country].filter(Boolean).join(", ")}
        </p>
        {dealer?.contact_person && <p>Attn: {dealer.contact_person}</p>}
        {dealer?.email && <p>{dealer.email}</p>}
        {dealer?.phone && <p>{dealer.phone}</p>}
      </div>

      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-800 text-xs uppercase text-slate-500">
            <th className="text-left py-2 pr-4 align-top">Order-No.</th>
            <th className="text-left py-2 pr-4 align-top">Product</th>
            <th className="text-right py-2 pr-4 align-top">Qty</th>
            <th className="text-right py-2 pr-4 align-top">
              Unit Price,
              <br />
              EUR
            </th>
            <th className="text-right py-2 align-top">
              Total,
              <br />
              EUR
            </th>
          </tr>
        </thead>
        <tbody>
          {(items ?? []).map((i) => (
            <tr key={i.id} className="border-b border-slate-200">
              <td className="py-2 pr-4 font-mono text-xs">{i.sku}</td>
              <td className="py-2 pr-4">{i.product_name}</td>
              <td className="py-2 pr-4 text-right">{i.quantity}</td>
              <td className="py-2 pr-4 text-right">{amountFmt(Number(i.unit_price))}</td>
              <td className="py-2 text-right">{amountFmt(Number(i.total))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-10">
        <div className="w-64">
          <div className="flex justify-between py-1 text-sm">
            <span className="text-slate-500">Items total</span>
            <span>{amountFmt(itemsTotal)} {invoice.currency}</span>
          </div>
          <div className="flex justify-between py-1 text-sm">
            <span className="text-slate-500">Freight Charges</span>
            <span>{amountFmt(freightCharges)} {invoice.currency}</span>
          </div>
          <div className="flex justify-between py-1 text-sm">
            <span className="text-slate-500">VAT (0%)</span>
            <span>{amountFmt(vatAmount)} {invoice.currency}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-slate-800 font-bold text-base">
            <span>Final amount</span>
            <span>{amountFmt(finalAmount)} {invoice.currency}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
