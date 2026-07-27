import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import TasksList from "@/components/TasksList";
import { buildAuthorNameMap } from "@/lib/userNames";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, dealers(id, company_name)")
    .order("due_date", { ascending: true, nullsFirst: false });

  const { data: profiles } = await supabase.from("profiles").select("email, first_name, last_name");
  const authorNames = buildAuthorNameMap(profiles ?? []);

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Tasks</h1>
      <TasksList tasks={tasks ?? []} authorNames={authorNames} />
    </AppShell>
  );
}
