import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function InvoicePrintPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, dealers(*), orders(order_number)")
    .eq("id", params.id)
    .single();
  if (!invoice) notFound();

  const { data: items } = await supabase.from("invoice_items").select("*").eq("invoice_id", params.id);
  const total = (items ?? []).reduce((s, i) => s + (Number(i.total) || 0), 0);
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
          </p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold mb-2">INVOICE</h2>
          <p>
            <span className="text-slate-500">No: </span>
            {invoice.invoice_number}
          </p>
          <p>
            <span className="text-slate-500">Date: </span>
            {invoice.invoice_date}
          </p>
          {invoice.orders?.order_number && (
            <p>
              <span className="text-slate-500">Order: </span>
              {invoice.orders.order_number}
            </p>
          )}
          <p>
            <span className="text-slate-500">Status: </span>
            {invoice.status}
          </p>
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
            <th className="text-left py-2">Order-No.</th>
            <th className="text-left py-2">Product</th>
            <th className="text-right py-2">Qty</th>
            <th className="text-right py-2">Unit Price</th>
            <th className="text-right py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {(items ?? []).map((i) => (
            <tr key={i.id} className="border-b border-slate-200">
              <td className="py-2 font-mono text-xs">{i.sku}</td>
              <td className="py-2">{i.product_name}</td>
              <td className="py-2 text-right">{i.quantity}</td>
              <td className="py-2 text-right">{Number(i.unit_price).toLocaleString("de-DE")}</td>
              <td className="py-2 text-right">{Number(i.total).toLocaleString("de-DE")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-10">
        <div className="w-64">
          <div className="flex justify-between py-2 border-t-2 border-slate-800 font-bold text-base">
            <span>Total</span>
            <span>
              {total.toLocaleString("de-DE")} {invoice.currency}
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400">VAT rate 0%</p>
    </div>
  );
}
