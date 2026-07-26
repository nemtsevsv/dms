"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden fixed top-4 right-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 shadow-lg"
    >
      Print / Save as PDF
    </button>
  );
}
