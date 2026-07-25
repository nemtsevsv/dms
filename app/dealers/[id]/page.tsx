import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import DealerForm from "@/components/DealerForm";
import DealerComments from "@/components/DealerComments";
import DealerTasks from "@/components/DealerTasks";
import DealerHistory from "@/components/DealerHistory";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDuration } from "@/lib/formatDuration";

export const dynamic = "force-dynamic";

export default async function DealerCardPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: dealer } = await supabase.from("dealers").select("*").eq("id", params.id).single();
  if (!dealer) notFound();

  const { data: comments } = await supabase
    .from("dealer_comments")
    .select("*")
    .eq("dealer_id", params.id)
    .order("created_at", { ascending: false });

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("dealer_id", params.id)
    .order("due_date", { ascending: true, nullsFirst: false });

  const { data: history } = await supabase
    .from("dealer_history")
    .select("*")
    .eq("dealer_id", params.id)
    .order("changed_at", { ascending: false });

  return (
    <AppShell>
      <Link href="/dealers" className="text-sm text-slate-500 hover:underline">
        ← All dealers
      </Link>
      <div className="flex items-center gap-3 mt-2 mb-6 flex-wrap">
        <h1 className="text-xl font-semibold">{dealer.company_name}</h1>
        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
          {dealer.status} · {formatDuration(dealer.status_changed_at)} in status
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
          <h2 className="font-medium mb-4">General Information</h2>
          <DealerForm dealer={dealer} />
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-medium mb-3">Tasks</h2>
            <DealerTasks dealerId={dealer.id} tasks={tasks ?? []} />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-medium mb-3">Comments</h2>
            <DealerComments dealerId={dealer.id} comments={comments ?? []} />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-medium mb-3">Change History</h2>
            <DealerHistory history={history ?? []} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
