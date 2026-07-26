"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string | null;
};

const priorityColors: Record<string, string> = {
  Low: "text-slate-500",
  Medium: "text-amber-600",
  High: "text-red-600",
};

export default function DealerTasks({ dealerId, tasks }: { dealerId: string; tasks: Task[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [saving, setSaving] = useState(false);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("tasks").insert({
      dealer_id: dealerId,
      title,
      priority,
      assigned_to: assignedTo || null,
      due_date: dueDate || null,
      status: "New",
      created_by: user?.email ?? null,
    });
    setTitle("");
    setDueDate("");
    setAssignedTo("");
    setSaving(false);
    router.refresh();
  }

  async function toggleComplete(task: Task) {
    await supabase
      .from("tasks")
      .update({ status: task.status === "Completed" ? "New" : "Completed" })
      .eq("id", task.id);
    router.refresh();
  }

  async function deleteTask(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={addTask} className="flex flex-wrap gap-2 mb-4">
        <input
          placeholder="New task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 min-w-[150px] px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
        <input
          placeholder="Assigned to"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="w-28 px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <button disabled={saving} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50">
          Add
        </button>
      </form>
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <input
                type="checkbox"
                checked={t.status === "Completed"}
                onChange={() => toggleComplete(t)}
                aria-label="Mark completed"
                className="shrink-0"
              />
              <Link
                href={`/tasks/${t.id}`}
                title={t.title}
                className={`truncate hover:underline ${t.status === "Completed" ? "line-through text-slate-400" : ""}`}
              >
                {t.title}
              </Link>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {t.assigned_to && <span className="text-slate-400 hidden sm:inline">{t.assigned_to}</span>}
              <span className={priorityColors[t.priority]}>{t.priority}</span>
              {t.due_date && <span className="text-slate-400">{format(new Date(t.due_date), "dd.MM.yyyy")}</span>}
              <button onClick={() => deleteTask(t.id)} className="text-slate-300 hover:text-red-600" aria-label="Delete task">
                <Trash2 size={13} />
              </button>
            </div>
          </li>
        ))}
        {tasks.length === 0 && <p className="text-sm text-slate-400">No tasks for this dealer yet</p>}
      </ul>
    </div>
  );
}
