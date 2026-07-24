import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import TasksList from "@/components/TasksList";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, dealers(id, company_name)")
    .order("due_date", { ascending: true, nullsFirst: false });

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Tasks</h1>
      <TasksList tasks={tasks ?? []} />
    </AppShell>
  );
}
