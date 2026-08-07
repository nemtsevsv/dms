import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import MarketingActivityForm from "@/components/MarketingActivityForm";
import MarketingActivityResults from "@/components/MarketingActivityResults";
import DeleteActivityButton from "@/components/DeleteActivityButton";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MarketingActivityPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: activity, error } = await supabase.from("marketing_activities").select("*").eq("id", params.id).single();
  if (error || !activity) {
    console.error("[marketing-activities/[id]] failed to load activity", { id: params.id, error });
    notFound();
  }

  return (
    <AppShell>
      <Link href="/marketing-activities" className="text-sm text-slate-500 hover:underline">
        ← All activities
      </Link>
      <div className="flex items-center justify-between mt-2 mb-6 flex-wrap gap-2">
        <h1 className="text-xl font-semibold">{activity.name}</h1>
        <DeleteActivityButton activityId={activity.id} />
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm max-w-3xl">
          <h2 className="font-medium mb-4">General Information</h2>
          <MarketingActivityForm activity={activity} />
        </div>

        <MarketingActivityResults activityId={activity.id} activity={activity} />
      </div>
    </AppShell>
  );
}
