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

  const { data: profiles } = await supabase.from("profiles").select("email, first_name, last_name");
  const authorNames: Record<string, string> = {};
  for (const p of profiles ?? []) {
    const name = [p.last_name, p.first_name].filter(Boolean).join(" ");
    if (p.email && name) authorNames[p.email] = name;
  }

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Tasks</h1>
      <TasksList tasks={tasks ?? []} authorNames={authorNames} />
    </AppShell>
  );
}
