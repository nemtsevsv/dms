export type ItemComputedStatus = {
  label: string;
  colorClass: string;
  invoicedQty: number;
  waitingQty: number;
};

export function computeItemStatus(quantity: number, invoicedQty: number, orderStatus: string): ItemComputedStatus {
  const qty = Number(quantity) || 0;
  const inv = Number(invoicedQty) || 0;

  if (orderStatus === "Cancelled") {
    return { label: "Cancelled", colorClass: "bg-red-100 text-red-700", invoicedQty: inv, waitingQty: 0 };
  }
  if (inv <= 0) {
    if (orderStatus === "Completed") {
      return { label: "Cancelled", colorClass: "bg-red-100 text-red-700", invoicedQty: inv, waitingQty: 0 };
    }
    return { label: "Waiting", colorClass: "bg-amber-100 text-amber-700", invoicedQty: inv, waitingQty: qty };
  }
  if (inv < qty) {
    if (orderStatus === "Completed") {
      return {
        label: `Invoiced partly ${inv}/${qty} (rest cancelled)`,
        colorClass: "bg-blue-100 text-blue-700",
        invoicedQty: inv,
        waitingQty: 0,
      };
    }
    return {
      label: `Invoiced partly ${inv}/${qty}`,
      colorClass: "bg-blue-100 text-blue-700",
      invoicedQty: inv,
      waitingQty: qty - inv,
    };
  }
  return { label: "Invoiced", colorClass: "bg-emerald-100 text-emerald-700", invoicedQty: inv, waitingQty: 0 };
}
