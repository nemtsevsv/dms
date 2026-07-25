"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function TagMultiSelect({
  label,
  tableName,
  value,
  onChange,
}: {
  label: string;
  tableName: "product_categories" | "brands";
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const supabase = createClient();
  const [options, setOptions] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from(tableName)
      .select("name")
      .order("name")
      .then(({ data }) => {
        setOptions((data ?? []).map((r: any) => r.name));
        setLoading(false);
      });
  }, [tableName]);

  function toggle(tag: string) {
    if (value.includes(tag)) onChange(value.filter((v) => v !== tag));
    else onChange([...value, tag]);
  }

  async function addNewTag(e: React.FormEvent) {
    e.preventDefault();
    const tag = newTag.trim();
    if (!tag) return;
    if (!options.includes(tag)) {
      await supabase.from(tableName).insert({ name: tag });
      setOptions((prev) => [...prev, tag].sort());
    }
    if (!value.includes(tag)) onChange([...value, tag]);
    setNewTag("");
  }

  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 bg-slate-800 text-white text-xs px-2 py-1 rounded-full"
            >
              {v}
              <button type="button" onClick={() => toggle(v)}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {!loading && (
        <div className="flex flex-wrap gap-1 mb-2">
          {options
            .filter((o) => !value.includes(o))
            .map((o) => (
              <button
                type="button"
                key={o}
                onClick={() => toggle(o)}
                className="text-xs px-2 py-1 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100"
              >
                + {o}
              </button>
            ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder={`Add new ${label.toLowerCase()}...`}
          className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addNewTag(e as any);
            }
          }}
        />
        <button
          type="button"
          onClick={addNewTag}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
