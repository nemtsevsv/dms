"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Check } from "lucide-react";
import { format } from "date-fns";

export default function OrderDateEdit({ orderId, orderDate }: { orderId: string; orderDate: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(orderDate);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!value || value === orderDate) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await supabase.from("orders").update({ order_date: value }).eq("id", orderId);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 group">
        {format(new Date(orderDate), "dd.MM.yyyy")}
        <Pencil size={11} className="text-slate-300 group-hover:text-slate-500" />
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        autoFocus
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        className="border-b border-slate-400 focus:outline-none text-sm"
      />
      <button onClick={save} disabled={saving} className="text-slate-500 hover:text-slate-900">
        <Check size={14} />
      </button>
    </span>
  );
}
