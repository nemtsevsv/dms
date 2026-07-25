import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import TaskEditForm from "@/components/TaskEditForm";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TaskEditPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: task } = await supabase.from("tasks").select("*").eq("id", params.id).single();
  if (!task) notFound();

  const { data: dealers } = await supabase.from("dealers").select("id, company_name").order("company_name");

  return (
    <AppShell>
      <Link href="/tasks" className="text-sm text-slate-500 hover:underline">
        ← All tasks
      </Link>
      <h1 className="text-xl font-semibold mt-2 mb-6">Edit Task</h1>
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <TaskEditForm task={task} dealers={dealers ?? []} />
      </div>
    </AppShell>
  );
}
