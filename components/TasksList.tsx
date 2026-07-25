"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { format, isPast, isToday } from "date-fns";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string | null;
  dealers: { id: string; company_name: string } | null;
};

export default function TasksList({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [statusFilter, setStatusFilter] = useState("open");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return tasks;
    if (statusFilter === "open") return tasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled");
    return tasks.filter((t) => t.status === statusFilter);
  }, [tasks, statusFilter]);

  async function toggleComplete(task: Task) {
    await supabase
      .from("tasks")
      .update({ status: task.status === "Completed" ? "New" : "Completed" })
      .eq("id", task.id);
    router.refresh();
  }

  function rowColor(task: Task) {
    if (!task.due_date || task.status === "Completed") return "";
    if (isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))) return "bg-red-50";
    if (isToday(new Date(task.due_date))) return "bg-amber-50";
    return "";
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {[
          { key: "open", label: "Open" },
          { key: "all", label: "All" },
          { key: "Completed", label: "Completed" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${
              statusFilter === f.key ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[650px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3"></th>
              <th className="text-left px-4 py-3">Task</th>
              <th className="text-left px-4 py-3">Dealer</th>
              <th className="text-left px-4 py-3">Assigned To</th>
              <th className="text-left px-4 py-3">Priority</th>
              <th className="text-left px-4 py-3">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className={`border-t border-slate-100 ${rowColor(t)}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={t.status === "Completed"} onChange={() => toggleComplete(t)} />
                </td>
                <td className={`px-4 py-3 ${t.status === "Completed" ? "line-through text-slate-400" : ""}`}>
                  <Link href={`/tasks/${t.id}`} className="hover:underline">
                    {t.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {t.dealers ? (
                    <Link href={`/dealers/${t.dealers.id}`} className="hover:underline text-slate-600">
                      {t.dealers.company_name}
                    </Link>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{t.assigned_to || "—"}</td>
                <td className="px-4 py-3">{t.priority}</td>
                <td className="px-4 py-3">{t.due_date ? format(new Date(t.due_date), "dd.MM.yyyy") : "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  No tasks
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
