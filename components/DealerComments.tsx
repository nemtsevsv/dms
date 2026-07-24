"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

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
  const [author, setAuthor] = useState("");
  const [saving, setSaving] = useState(false);

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    await supabase.from("dealer_comments").insert({
      dealer_id: dealerId,
      author: author || "User",
      text,
    });
    setText("");
    setSaving(false);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={addComment} className="flex gap-2 mb-4">
        <input
          placeholder="Ваше имя"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
        <input
          placeholder="Добавить комментарий..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
        <button
          disabled={saving}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          Добавить
        </button>
      </form>
      <ul className="space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="border-b border-slate-100 pb-2">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium text-slate-600">{c.author}</span>
              <span>{format(new Date(c.created_at), "dd.MM.yyyy HH:mm")}</span>
            </div>
            <div className="text-sm">{c.text}</div>
          </li>
        ))}
        {comments.length === 0 && <p className="text-sm text-slate-400">Комментариев пока нет</p>}
      </ul>
    </div>
  );
}
