"use client";

import { useEffect, useRef, useState } from "react";

type CountryOption = { iso2: string; country_en: string };

export default function CountrySearchCombobox({
  countries,
  value,
  onSelect,
}: {
  countries: CountryOption[];
  value: string;
  onSelect: (iso2: string) => void;
}) {
  const selected = countries.find((c) => c.iso2 === value);
  const [query, setQuery] = useState(selected ? `${selected.iso2} — ${selected.country_en}` : "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(selected ? `${selected.iso2} — ${selected.country_en}` : "");
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const q = query.trim().toLowerCase();
  const matches =
    q.length === 0
      ? []
      : countries
          .filter((c) => c.iso2.toLowerCase().startsWith(q) || c.country_en.toLowerCase().includes(q))
          .sort((a, b) => {
            // ISO2 prefix matches first, then alphabetical by name — the
            // most useful ordering when someone's typing a code.
            const aIso = a.iso2.toLowerCase().startsWith(q) ? 0 : 1;
            const bIso = b.iso2.toLowerCase().startsWith(q) ? 0 : 1;
            if (aIso !== bIso) return aIso - bIso;
            return a.country_en.localeCompare(b.country_en);
          })
          .slice(0, 10);

  function choose(c: CountryOption) {
    onSelect(c.iso2);
    setQuery(`${c.iso2} — ${c.country_en}`);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(matches[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
          if (e.target.value === "") onSelect("");
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Type an ISO2 code or country name..."
        className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-slate-300"
      />
      {open && matches.length > 0 && (
        <div className="absolute z-20 mt-1 w-full sm:w-80 bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {matches.map((c, i) => (
            <button
              key={c.iso2}
              onClick={() => choose(c)}
              onMouseEnter={() => setHighlight(i)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${i === highlight ? "bg-slate-100" : "hover:bg-slate-50"}`}
            >
              <span className="font-mono text-xs text-slate-400 w-7 shrink-0">{c.iso2}</span>
              <span className="text-slate-700">{c.country_en}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
