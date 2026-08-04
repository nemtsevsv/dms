import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import InvoiceHeader from "@/components/InvoiceHeader";
import InvoiceItemsManager from "@/components/InvoiceItemsManager";
import DeleteInvoiceButton from "@/components/DeleteInvoiceButton";
import CreatedByLine from "@/components/CreatedByLine";
import FiscalYearBadge from "@/components/FiscalYearBadge";
import { buildAuthorNameMap } from "@/lib/userNames";
import { btnExport } from "@/lib/buttonStyles";
import { Download } from "lucide-react";
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

  const [{ data: items }, { data: profiles }, { data: orderItems }] = await Promise.all([
    supabase.from("invoice_items").select("*").eq("invoice_id", params.id),
    supabase.from("profiles").select("email, first_name, last_name"),
    invoice.order_id
      ? supabase.from("order_items").select("id, sku, product_name, quantity, unit_price").eq("order_id", invoice.order_id)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const authorNames = buildAuthorNameMap(profiles ?? []);

  // Items can only be added to an invoice if they already exist on the
  // linked order — first add to the order, then it becomes invoiceable.
  let orderItemsForPicker: { id: string; sku: string | null; product_name: string | null; unit_price: number | null; remaining: number }[] = [];
  if (invoice.order_id) {
    const orderItemIds = (orderItems ?? []).map((i) => i.id);
    const invoicedTotalByItem: Record<string, number> = {};
    if (orderItemIds.length > 0) {
      const { data: allInvoiceItems } = await supabase
        .from("invoice_items")
        .select("order_item_id, quantity, invoices!inner(status)")
        .in("order_item_id", orderItemIds)
        .neq("invoices.status", "Cancelled");
      for (const row of allInvoiceItems ?? []) {
        if (!row.order_item_id) continue;
        invoicedTotalByItem[row.order_item_id] = (invoicedTotalByItem[row.order_item_id] ?? 0) + (Number(row.quantity) || 0);
      }
    }

    orderItemsForPicker = (orderItems ?? []).map((oi) => ({
      id: oi.id,
      sku: oi.sku,
      product_name: oi.product_name,
      unit_price: oi.unit_price,
      remaining: (Number(oi.quantity) || 0) - (invoicedTotalByItem[oi.id] ?? 0),
    }));
  }

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
        <CreatedByLine createdAt={invoice.created_at} createdBy={invoice.created_by} authorNames={authorNames} />
        <FiscalYearBadge />
        <div className="flex items-center gap-2">
          <Link
            href={`/invoices/${invoice.id}/print`}
            target="_blank"
            className={btnExport}
          >
            <Download size={14} />
            Download PDF
          </Link>
          <DeleteInvoiceButton invoiceId={invoice.id} orderId={invoice.orders?.id} />
        </div>
      </div>

      <InvoiceHeader invoice={invoice} />
      <InvoiceItemsManager invoiceId={invoice.id} items={items ?? []} currency={invoice.currency} orderItems={orderItemsForPicker} />
    </AppShell>
  );
}
