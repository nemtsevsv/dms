"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";

export default function ProfileForm() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email ?? "");
      const meta = user.user_metadata || {};
      setFirstName(meta.first_name ?? "");
      setLastName(meta.last_name ?? "");
      setPosition(meta.position ?? "");
      setLoading(false);
    });
  }, []);

  const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setError(null);

    const { error: metaError } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName, position },
      ...(email ? { email } : {}),
      ...(newPassword ? { password: newPassword } : {}),
    } as any);

    if (metaError) {
      setError(metaError.message);
      setSaving(false);
      return;
    }

    await supabase.from("profiles").upsert({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      position,
      updated_at: new Date().toISOString(),
    });

    setNewPassword("");
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) return <p className="text-sm text-slate-400">Loading...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>First Name</label>
          <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Last Name</label>
          <input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Position</label>
        <input className={inputCls} value={position} onChange={(e) => setPosition(e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Email</label>
        <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
        <p className="text-xs text-slate-400 mt-1">Changing your email may require confirming it via a link sent to the new address.</p>
      </div>
      <div>
        <label className={labelCls}>New Password</label>
        <input
          type="password"
          placeholder="Leave blank to keep current password"
          className={inputCls}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button disabled={saving} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <Check size={16} /> Saved
          </span>
        )}
      </div>
    </form>
  );
}
