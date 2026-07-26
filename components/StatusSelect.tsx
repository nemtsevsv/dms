"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { DEALER_STATUSES, STATUS_COLORS } from "@/lib/statusColors";

export default function StatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = STATUS_COLORS[value] ?? STATUS_COLORS.New;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between gap-2 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm ${current.badge}`}
      >
        <span className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${current.dot}`} />
          {value}
        </span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {DEALER_STATUSES.map((s) => {
            const c = STATUS_COLORS[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-50 text-left"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
