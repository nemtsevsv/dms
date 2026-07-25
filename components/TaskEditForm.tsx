"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

export default function TaskEditForm({
  task,
  dealers,
}: {
  task: any;
  dealers: { id: string; company_name: string }[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? "",
    dealer_id: task.dealer_id ?? "",
    assigned_to: task.assigned_to ?? "",
    priority: task.priority,
    status: task.status,
    due_date: task.due_date ?? "",
  });
  const [saving, setSaving] = useState(false);

  function update(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save() {
    setSaving(true);
    await supabase
      .from("tasks")
      .update({ ...form, dealer_id: form.dealer_id || null, updated_at: new Date().toISOString() })
      .eq("id", task.id);
    setSaving(false);
    router.push("/tasks");
    router.refresh();
  }

  async function remove() {
    await supabase.from("tasks").delete().eq("id", task.id);
    router.push("/tasks");
    router.refresh();
  }

  const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <label className={labelCls}>Title</label>
        <input className={inputCls} value={form.title} onChange={(e) => update("title", e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Description</label>
        <textarea rows={3} className={inputCls} value={form.description} onChange={(e) => update("description", e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Dealer</label>
          <select className={inputCls} value={form.dealer_id} onChange={(e) => update("dealer_id", e.target.value)}>
            <option value="">— none —</option>
            {dealers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.company_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Assigned To</label>
          <input className={inputCls} value={form.assigned_to} onChange={(e) => update("assigned_to", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Priority</label>
          <select className={inputCls} value={form.priority} onChange={(e) => update("priority", e.target.value)}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select className={inputCls} value={form.status} onChange={(e) => update("status", e.target.value)}>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Due Date</label>
          <input type="date" className={inputCls} value={form.due_date} onChange={(e) => update("due_date", e.target.value)} />
        </div>
      </div>

      {task.created_by && <p className="text-xs text-slate-400">Created by {task.created_by}</p>}

      <div className="flex items-center justify-between pt-2">
        <button onClick={save} disabled={saving} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50">
          {saving ? "Saving..." : "Save changes"}
        </button>
        <button onClick={remove} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">
          <Trash2 size={14} /> Delete task
        </button>
      </div>
    </div>
  );
}
