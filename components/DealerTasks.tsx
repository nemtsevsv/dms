"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
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
  const [saving, setSaving] = useState(false);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await supabase.from("tasks").insert({
      dealer_id: dealerId,
      title,
      priority,
      due_date: dueDate || null,
      status: "New",
    });
    setTitle("");
    setDueDate("");
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

  return (
    <div>
      <form onSubmit={addTask} className="flex flex-wrap gap-2 mb-4">
        <input
          placeholder="Новая задача..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <button
          disabled={saving}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          Добавить
        </button>
      </form>
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={t.status === "Completed"}
                onChange={() => toggleComplete(t)}
              />
              <span className={t.status === "Completed" ? "line-through text-slate-400" : ""}>{t.title}</span>
            </label>
            <div className="flex items-center gap-3">
              <span className={priorityColors[t.priority]}>{t.priority}</span>
              {t.due_date && <span className="text-slate-400">{format(new Date(t.due_date), "dd.MM.yyyy")}</span>}
            </div>
          </li>
        ))}
        {tasks.length === 0 && <p className="text-sm text-slate-400">Задач по дилеру пока нет</p>}
      </ul>
    </div>
  );
}
