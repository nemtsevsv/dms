import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import InvoiceHeader from "@/components/InvoiceHeader";
import InvoiceItemsManager from "@/components/InvoiceItemsManager";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, dealers(id, company_name), orders(id, order_number)")
    .eq("id", params.id)
    .single();
  if (!invoice) notFound();

  const { data: items } = await supabase.from("invoice_items").select("*").eq("invoice_id", params.id);

  return (
    <AppShell>
      {invoice.orders && (
        <Link href={`/orders/${invoice.orders.id}`} className="text-sm text-slate-500 hover:underline">
          ← Back to order {invoice.orders.order_number}
        </Link>
      )}
      <h1 className="text-xl font-semibold mt-2 mb-1">{invoice.invoice_number}</h1>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <p className="text-sm text-slate-500">Dealer: {invoice.dealers?.company_name}</p>
        <Link
          href={`/invoices/${invoice.id}/print`}
          target="_blank"
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
        >
          Download PDF
        </Link>
      </div>

      <InvoiceHeader invoice={invoice} />
      <InvoiceItemsManager invoiceId={invoice.id} items={items ?? []} currency={invoice.currency} />
    </AppShell>
  );
}
