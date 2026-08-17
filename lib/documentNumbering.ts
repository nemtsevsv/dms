// Sequential document numbering — ORD-CA{YYYY}{XXX} for orders,
// INV-CA{YYYY}{XXX} for invoices, both 3-digit-padded and reset per
// calendar year. A second, third, ... invoice against the SAME order
// reuses that order's base invoice number with a "-2", "-3", ... suffix,
// rather than taking a fresh sequential number of its own.

function formatSeq(n: number): string {
  return String(n).padStart(3, "0");
}

export async function getNextOrderNumber(supabase: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORD-CA${year}`;
  const { data } = await supabase.from("orders").select("order_number").like("order_number", `${prefix}%`);

  let maxSeq = 0;
  const pattern = new RegExp(`^ORD-CA${year}(\\d+)$`);
  for (const row of data ?? []) {
    const m = (row.order_number as string).match(pattern);
    if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
  }
  return `${prefix}${formatSeq(maxSeq + 1)}`;
}

export async function getNextInvoiceNumber(supabase: any, orderId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-CA${year}`;

  // If this order already has one or more invoices, this new one shares
  // their base number with a "-N" suffix, rather than getting a fresh
  // sequential number of its own.
  const { data: existingForOrder } = await supabase
    .from("invoices")
    .select("invoice_number, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (existingForOrder && existingForOrder.length > 0) {
    const firstNumber = existingForOrder[0].invoice_number as string;
    const baseNumber = firstNumber.split("-").slice(0, 2).join("-"); // "INV-CA2026004-2" -> "INV-CA2026004"
    return `${baseNumber}-${existingForOrder.length + 1}`;
  }

  // No invoice for this order yet — take the next fresh sequential number
  // for the year (matching only base numbers, so a "-2"/"-3" suffix on an
  // existing invoice never gets mistaken for a new base sequence value).
  const { data } = await supabase.from("invoices").select("invoice_number").like("invoice_number", `${prefix}%`);
  let maxSeq = 0;
  const pattern = new RegExp(`^INV-CA${year}(\\d+)(?:-\\d+)?$`);
  for (const row of data ?? []) {
    const m = (row.invoice_number as string).match(pattern);
    if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
  }
  return `${prefix}${formatSeq(maxSeq + 1)}`;
}
