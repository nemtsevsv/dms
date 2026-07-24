"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUSES = ["New", "Processing", "Completed", "Cancelled"];

export default function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await supabase.from("orders").update({ status: e.target.value, updated_at: new Date().toISOString() }).eq("id", orderId);
    router.refresh();
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
