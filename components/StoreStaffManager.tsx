"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

type StaffRow = { id: string; email: string; display_name: string | null; role: string };

export default function StoreStaffManager({ storeId, staff }: { storeId: string; staff: StaffRow[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("seller");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("store_users").insert({
      store_id: storeId,
      email: email.trim().toLowerCase(),
      display_name: displayName.trim() || null,
      role,
    });
    if (error) {
      setError(error.message.includes("duplicate") ? "This email is already assigned to a store." : error.message);
    } else {
      setEmail("");
      setDisplayName("");
      setRole("seller");
      router.refresh();
    }
    setSaving(false);
  }

  async function removeStaff(id: string) {
    await supabase.from("store_users").delete().eq("id", id);
    router.refresh();
  }

  async function updateRole(id: string, newRole: string) {
    await supabase.from("store_users").update({ role: newRole }).eq("id", id);
    router.refresh();
  }

  const inputCls = "px-3 py-2 border border-slate-300 rounded-lg text-sm";

  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">
        Create the login for this person in Supabase → Authentication → Users first (email + password), then add their email
        here to give them access to this store only.
      </p>
      <form onSubmit={addStaff} className="flex flex-wrap gap-2 mb-4">
        <input
          type="email"
          required
          placeholder="Email (must match their login)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls + " flex-1 min-w-[200px]"}
        />
        <input placeholder="Display name (optional)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls + " w-48"} />
        <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
          <option value="seller">Seller</option>
          <option value="store_manager">Store Manager</option>
        </select>
        <button disabled={saving} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50">
          Add
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{s.display_name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">{s.email}</td>
                <td className="px-4 py-3">
                  <select value={s.role} onChange={(e) => updateRole(s.id, e.target.value)} className="px-2 py-1 border border-slate-200 rounded text-sm">
                    <option value="seller">Seller</option>
                    <option value="store_manager">Store Manager</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => removeStaff(s.id)} className="text-slate-300 hover:text-red-600" aria-label="Remove staff">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-slate-400">
                  No staff assigned yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
