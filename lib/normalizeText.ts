// Free-text fields (like Country) get typed slightly differently by different
// people ("Kazakhstan", "kazakhstan ", "Kazakhstan  "). This groups those
// variants together for filters, picking one consistent display value.

function normalizeKey(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

export function buildCanonicalMap(values: (string | null | undefined)[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const raw of values) {
    if (!raw) continue;
    const trimmed = raw.trim().replace(/\s+/g, " ");
    if (!trimmed) continue;
    const key = normalizeKey(trimmed);
    if (!map.has(key)) map.set(key, trimmed);
  }
  return map;
}

export function canonicalValue(raw: string | null | undefined, map: Map<string, string>): string {
  if (!raw) return "";
  const key = normalizeKey(raw);
  return map.get(key) ?? raw.trim();
}
