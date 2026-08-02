"use client";

export default function SegmentedRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
            value === n ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
