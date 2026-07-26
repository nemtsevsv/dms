"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

export default function DealerComments({
  dealerId,
  comments,
}: {
  dealerId: string;
  comments: { id: string; author: string; text: string; created_at: string }[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("dealer_comments").insert({
      dealer_id: dealerId,
      author: user?.email ?? "User",
      text,
    });
    setText("");
    setSaving(false);
    router.refresh();
  }

  async function deleteComment(id: string) {
    await supabase.from("dealer_comments").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={addComment} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm min-w-0"
        />
        <button
          disabled={saving}
          className="w-full sm:w-auto shrink-0 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          Add
        </button>
      </form>
      <ul className="space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="border-b border-slate-100 pb-2 group">
            <div className="flex justify-between items-start text-xs text-slate-400 mb-1">
              <span className="font-medium text-slate-600">{c.author}</span>
              <div className="flex items-center gap-2">
                <span>{format(new Date(c.created_at), "dd.MM.yyyy HH:mm")}</span>
                <button onClick={() => deleteComment(c.id)} className="text-slate-300 hover:text-red-600" aria-label="Delete comment">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="text-sm break-words">{c.text}</div>
          </li>
        ))}
        {comments.length === 0 && <p className="text-sm text-slate-400">No comments yet</p>}
      </ul>
    </div>
  );
}
