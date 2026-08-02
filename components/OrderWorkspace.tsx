"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardPaste, Download } from "lucide-react";
import OrderNumberEdit from "./OrderNumberEdit";
import OrderDateEdit from "./OrderDateEdit";
import CreatedByLine from "./CreatedByLine";
import FiscalYearBadge from "./FiscalYearBadge";
import CreateInvoiceButton from "./CreateInvoiceButton";
import OrderStatusSelect from "./OrderStatusSelect";
import DeleteOrderButton from "./DeleteOrderButton";
import BulkAddItems from "./BulkAddItems";
import OrderItemsManager from "./OrderItemsManager";
import { computeItemStatus } from "@/lib/orderItemStatus";
import { exportToXlsx } from "@/lib/exportXlsx";
import { btnImport, btnExport } from "@/lib/buttonStyles";

const invoiceStatusColors: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600 border-slate-300",
  Sent: "bg-blue-100 text-blue-700 border-blue-300",
  Paid: "bg-emerald-100 text-emerald-700 border-emerald-300",
  Cancelled: "bg-red-100 text-red-700 border-red-300",
};

export default function OrderWorkspace({
  order,
  items,
  invoicedQtyByItem,
  products,
  dealerDiscount,
  invoices,
  authorNames,
}: {
  order: any;
  items: any[];
  invoicedQtyByItem: Record<string, number>;
  products: any[];
  dealerDiscount: number;
  invoices: any[];
  authorNames: Record<string, string>;
}) {
  const [pasteOpen, setPasteOpen] = useState(false);

  function exportItemsXlsx() {
    const header = ["Order-No.", "Product", "Qty", "List Price", "Discount %", "Dealer Price", "Total", "Status"];
    const rows = items.map((i: any) => {
      const status = computeItemStatus(Number(i.quantity) || 0, invoicedQtyByItem[i.id] ?? 0, order.status);
      return [
        i.sku ?? "",
        i.product_name ?? "",
        i.quantity ?? 0,
        i.list_price ?? "",
        i.dealer_discount_percent ?? 0,
        i.unit_price ?? "",
        i.total ?? "",
        status.label,
      ];
    });
    exportToXlsx(`${order.order_number}-items.xlsx`, header, rows, "Order Items");
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 mb-6">
        <div>
          <OrderNumberEdit orderId={order.id} orderNumber={order.order_number} />
          <p className="text-sm text-slate-500 mt-1">
            Dealer:{" "}
            <Link href={`/dealers/${order.dealers?.id}`} className="hover:underline">
              {order.dealers?.company_name}
            </Link>{" "}
            · <OrderDateEdit orderId={order.id} orderDate={order.order_date} /> · {order.currency} · Discount: {dealerDiscount}%
          </p>
          <CreatedByLine createdAt={order.created_at} createdBy={order.created_by} authorNames={authorNames} />
          <div className="mt-1">
            <FiscalYearBadge />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setPasteOpen((v) => !v)} className={btnImport}>
            <ClipboardPaste size={14} />
            Paste list of items
          </button>
          <button onClick={exportItemsXlsx} className={btnExport}>
            <Download size={14} />
            Export to Excel
          </button>
          <CreateInvoiceButton
            orderId={order.id}
            orderNumber={order.order_number}
            dealerId={order.dealers?.id}
            currency={order.currency}
            items={items}
            invoicedQtyByItem={invoicedQtyByItem}
            orderStatus={order.status}
          />
          <OrderStatusSelect orderId={order.id} status={order.status} />
          <DeleteOrderButton orderId={order.id} />
        </div>
      </div>

      {invoices.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {invoices.map((inv) => (
            <Link
              key={inv.id}
              href={`/invoices/${inv.id}`}
              className={`text-sm px-3 py-1.5 rounded-lg border ${invoiceStatusColors[inv.status] ?? "border-slate-300"}`}
            >
              {inv.invoice_number} · {inv.status}
            </Link>
          ))}
        </div>
      )}

      {order.status === "Cancelled" && (
        <p className="text-sm text-red-600 mb-4">This order is cancelled — all items are shown as Cancelled.</p>
      )}
      {order.status === "Completed" && (
        <p className="text-sm text-blue-600 mb-4">
          This order is completed — any quantity that was never invoiced is now treated as cancelled.
        </p>
      )}

      {pasteOpen && (
        <BulkAddItems
          orderId={order.id}
          products={products}
          dealerDiscount={dealerDiscount}
          onDone={() => setPasteOpen(false)}
        />
      )}

      <OrderItemsManager
        orderId={order.id}
        orderStatus={order.status}
        items={items}
        invoicedQtyByItem={invoicedQtyByItem}
        currency={order.currency}
        products={products}
        dealerDiscount={dealerDiscount}
      />
    </div>
  );
}
