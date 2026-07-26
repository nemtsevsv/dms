"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, ArrowUp, ArrowDown } from "lucide-react";

export default function ColumnFilterHeader({
  label,
  options,
  selected,
  onChange,
  sortDir,
  onSort,
  align = "left",
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  sortDir?: "asc" | "desc" | null;
  onSort?: (dir: "asc" | "desc") => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const allSelected = selected.length === 0 || selected.length === options.length;

  function toggle(opt: string) {
    const base = selected.length === 0 ? [...options] : selected;
    if (base.includes(opt)) onChange(base.filter((o) => o !== opt));
    else onChange([...base, opt]);
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
        <span>{label}</span>
        {onSort && (
          <button onClick={() => onSort(sortDir === "asc" ? "desc" : "asc")} className="text-slate-400 hover:text-slate-700">
            {sortDir === "asc" ? <ArrowUp size={11} /> : sortDir === "desc" ? <ArrowDown size={11} /> : <ArrowUp size={11} className="opacity-30" />}
          </button>
        )}
        <button onClick={() => setOpen((o) => !o)} className={`hover:text-slate-700 ${!allSelected ? "text-slate-900" : "text-slate-400"}`}>
          <Filter size={11} fill={!allSelected ? "currentColor" : "none"} />
        </button>
      </div>
      {open && (
        <div className="absolute z-30 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 w-52 max-h-64 overflow-y-auto normal-case font-normal text-slate-700 left-0">
          <div className="flex justify-between text-xs px-1 pb-1 mb-1 border-b border-slate-100">
            <button className="text-blue-600 hover:underline" onClick={() => onChange([])}>
              Select all
            </button>
            <button className="text-blue-600 hover:underline" onClick={() => onChange(["__none__"])}>
              Clear
            </button>
          </div>
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-xs px-1 py-1 hover:bg-slate-50 rounded cursor-pointer">
              <input type="checkbox" checked={allSelected || selected.includes(opt)} onChange={() => toggle(opt)} />
              <span className="truncate">{opt || "(empty)"}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
