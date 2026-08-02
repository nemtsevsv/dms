import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import { btnPrimary } from "@/lib/buttonStyles";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const supabase = createClient();
  const { data: stores } = await supabase.from("stores").select("*").order("name");

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-xl font-semibold">Stores</h1>
        <Link href="/stores/new" className={btnPrimary}>
          + New Store
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Store</th>
              <th className="text-left px-4 py-3">Country</th>
              <th className="text-left px-4 py-3">City</th>
              <th className="text-left px-4 py-3">Currency</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(stores ?? []).map((s) => (
              <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/stores/${s.id}`} className="font-medium hover:underline">
                    {s.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-500">{s.country}</td>
                <td className="px-4 py-3 text-slate-500">{s.city}</td>
                <td className="px-4 py-3 text-slate-500">{s.currency}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
            {(stores ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  No stores yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
