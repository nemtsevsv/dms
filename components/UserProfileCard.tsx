"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User } from "lucide-react";

export default function UserProfileCard({ onNavigate }: { onNavigate?: () => void }) {
  const supabase = createClient();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [position, setPosition] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      setEmail(user.email ?? null);
      const meta = user.user_metadata || {};
      const fullName = [meta.first_name, meta.last_name].filter(Boolean).join(" ");
      setName(fullName || null);
      setPosition(meta.position || null);
    });
  }, []);

  const initials = name
    ? name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (email?.[0] ?? "?").toUpperCase();

  return (
    <Link
      href="/profile"
      onClick={onNavigate}
      className="flex items-center gap-3 px-3 py-3 border-t border-slate-800 hover:bg-slate-800 transition-colors"
    >
      <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-white shrink-0">
        {initials || <User size={16} />}
      </div>
      <div className="min-w-0">
        <div className="text-sm text-white truncate">{name || email || "My Profile"}</div>
        <div className="text-xs text-slate-400 truncate">{position || email}</div>
      </div>
    </Link>
  );
}
