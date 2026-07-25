"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FileText } from "lucide-react";

type Item = {
  sku: string | null;
  product_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
  status: string;
};

export default function CreateInvoiceButton({
  orderId,
  orderNumber,
  dealerId,
  dealerName,
  currency,
  items,
}: {
  orderId: string;
  orderNumber: string;
  dealerId: string;
  dealerName: string;
  currency: string;
  items: Item[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [creating, setCreating] = useState(false);

  async function createInvoice() {
    setCreating(true);
    const activeItems = items.filter((i) => i.status !== "Cancelled");
    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        invoice_number: `INV-${orderNumber}`,
        order_id: orderId,
        dealer_id: dealerId,
        currency,
      })
      .select()
      .single();

    if (!error && invoice) {
      if (activeItems.length > 0) {
        await supabase.from("invoice_items").insert(
          activeItems.map((i) => ({
            invoice_id: invoice.id,
            sku: i.sku,
            product_name: i.product_name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            total: i.total,
          }))
        );
      }
      router.push(`/invoices/${invoice.id}`);
      return;
    }
    setCreating(false);
  }

  return (
    <button
      onClick={createInvoice}
      disabled={creating}
      className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
    >
      <FileText size={14} />
      {creating ? "Creating..." : "Create Invoice"}
    </button>
  );
}
