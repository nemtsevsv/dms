"use client";

import { useEffect } from "react";

export default function RetailReportsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[retail-reports] rendering error", error);
  }, [error]);

  return (
    <div className="p-4 max-w-lg mx-auto mt-12">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <h2 className="font-medium text-red-700 mb-2">Something went wrong loading Retail Reports</h2>
        <p className="text-sm text-red-600 mb-1 break-words">{error.message || "Unknown error"}</p>
        {error.stack && <pre className="text-[10px] text-red-400 mb-3 overflow-x-auto whitespace-pre-wrap">{error.stack.split("\n").slice(0, 4).join("\n")}</pre>}
        <button onClick={() => reset()} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
          Try again
        </button>
      </div>
    </div>
  );
}
