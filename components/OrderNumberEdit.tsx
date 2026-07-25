"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Check } from "lucide-react";

export default function OrderNumberEdit({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(orderNumber);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!value.trim() || value === orderNumber) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await supabase.from("orders").update({ order_number: value.trim() }).eq("id", orderId);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="flex items-center gap-2 group">
        <h1 className="text-xl font-semibold">{orderNumber}</h1>
        <Pencil size={14} className="text-slate-300 group-hover:text-slate-500" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        className="text-xl font-semibold border-b border-slate-400 focus:outline-none"
      />
      <button onClick={save} disabled={saving} className="text-slate-500 hover:text-slate-900">
        <Check size={18} />
      </button>
    </div>
  );
}
