"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FileText } from "lucide-react";

type Item = {
  id: string;
  sku: string | null;
  product_name: string | null;
  quantity: number | null;
  unit_price: number | null;
};

export default function CreateInvoiceButton({
  orderId,
  orderNumber,
  dealerId,
  currency,
  items,
  invoicedQtyByItem,
  orderStatus,
}: {
  orderId: string;
  orderNumber: string;
  dealerId?: string;
  currency: string;
  items: Item[];
  invoicedQtyByItem: Record<string, number>;
  orderStatus: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [creating, setCreating] = useState(false);

  const remainingItems = items
    .map((i) => ({ ...i, remaining: (Number(i.quantity) || 0) - (invoicedQtyByItem[i.id] ?? 0) }))
    .filter((i) => i.remaining > 0);

  async function createInvoice() {
    setCreating(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        invoice_number: `INV-${orderNumber}-${Date.now().toString().slice(-4)}`,
        order_id: orderId,
        dealer_id: dealerId,
        currency,
        created_by: user?.email ?? null,
      })
      .select()
      .single();

    if (!error && invoice) {
      if (remainingItems.length > 0) {
        await supabase.from("invoice_items").insert(
          remainingItems.map((i) => ({
            invoice_id: invoice.id,
            order_item_id: i.id,
            sku: i.sku,
            product_name: i.product_name,
            quantity: i.remaining,
            unit_price: i.unit_price,
            total: Math.round((i.remaining * (Number(i.unit_price) || 0)) * 100) / 100,
          }))
        );
      }
      router.push(`/invoices/${invoice.id}`);
      return;
    }
    setCreating(false);
  }

  const disabled = creating || !dealerId || orderStatus === "Cancelled" || remainingItems.length === 0;

  return (
    <button
      onClick={createInvoice}
      disabled={disabled}
      title={remainingItems.length === 0 ? "All items are already fully invoiced" : undefined}
      className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
    >
      <FileText size={14} />
      {creating ? "Creating..." : "Create Invoice"}
    </button>
  );
}
