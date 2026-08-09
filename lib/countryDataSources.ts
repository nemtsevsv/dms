// Server-side only — talks to the three external sources. Every function
// returns a clean, typed result and never throws past its own boundary;
// callers decide how to handle a source being unavailable (World Bank and
// GeoNames are expected to be reliable; Eurostat is explicitly best-effort
// per the spike findings — dataset code / response shape may need
// adjustment once tested against the live API from a deployed environment).

export type YearValue = { year: number; value: number };

const CURRENT_YEAR = new Date().getFullYear();

// ---------------- World Bank ----------------
// Public, no key required. Returns up to the last 3 years that actually
// have a published (non-null) value — current-year figures are usually not
// published yet, so we look back a wider window and keep only real data.
export async function fetchWorldBankIndicator(iso2: string, indicator: string): Promise<YearValue[]> {
  const url = `https://api.worldbank.org/v2/country/${iso2}/indicator/${indicator}?format=json&date=${CURRENT_YEAR - 6}:${CURRENT_YEAR}&per_page=20`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`World Bank ${indicator} for ${iso2}: HTTP ${res.status}`);
  const json = await res.json();
  const rows = Array.isArray(json) ? json[1] : null;
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r: any) => r.value !== null && r.value !== undefined)
    .map((r: any) => ({ year: Number(r.date), value: Number(r.value) }))
    .sort((a, b) => b.year - a.year)
    .slice(0, 3);
}

// ---------------- GeoNames ----------------
// Requires a free username (registered once, stored as GEONAMES_USERNAME).
export async function fetchGeoNamesTopCities(iso2: string): Promise<{ name: string; population: number }[]> {
  const username = process.env.GEONAMES_USERNAME;
  if (!username) throw new Error("GEONAMES_USERNAME is not configured");
  const url = `https://secure.geonames.org/searchJSON?country=${iso2}&featureClass=P&orderby=population&maxRows=5&username=${encodeURIComponent(username)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`GeoNames for ${iso2}: HTTP ${res.status}`);
  const json = await res.json();
  if (json.status) throw new Error(`GeoNames error: ${json.status.message ?? "unknown"}`);
  const results = Array.isArray(json.geonames) ? json.geonames : [];
  return results
    .map((r: any) => ({ name: r.name as string, population: Number(r.population) || 0 }))
    .sort((a: any, b: any) => b.population - a.population)
    .slice(0, 5);
}

// ---------------- Eurostat Comext ----------------
// EXPERIMENTAL — per the pre-build spike, the exact dataset code and
// response shape for Comext CN8 export data could not be fully verified
// without live network access. This function is intentionally isolated so
// a failure here never blocks World Bank / GeoNames data from saving.
// If DS-059341 turns out to be wrong/retired, try DS-059322 next.
const EUROSTAT_DATASET = "DS-059341";

export async function fetchEurostatExport(iso2: string, cnCode: string, reporter: string): Promise<YearValue[]> {
  // SDMX 2.1 positional key — dimension order confirmed from Eurostat's own
  // documented example (A.<reporter>.<partner>...<indicator>). This exact
  // key layout for DS-059341 specifically is the part that needs a live
  // test; if the dimension order or dataset code is wrong, this will throw
  // and the caller will record it as a failed field rather than bad data.
  const key = `A.${reporter}.${iso2}.${cnCode}.EXP.VALUE_EUR`;
  const url = `https://ec.europa.eu/eurostat/api/comext/dissemination/sdmx/2.1/data/${EUROSTAT_DATASET}/${key}?format=SDMX-CSV`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Eurostat ${EUROSTAT_DATASET} ${key}: HTTP ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const header = lines[0].split(",");
  const timeIdx = header.indexOf("TIME_PERIOD");
  const valueIdx = header.indexOf("OBS_VALUE");
  if (timeIdx === -1 || valueIdx === -1) throw new Error("Eurostat response shape unexpected — no TIME_PERIOD/OBS_VALUE columns");
  const byYear = new Map<number, number>();
  for (const line of lines.slice(1)) {
    const cols = line.split(",");
    const period = cols[timeIdx];
    const val = Number(cols[valueIdx]);
    if (!period || Number.isNaN(val)) continue;
    const year = Number(period.slice(0, 4));
    byYear.set(year, (byYear.get(year) ?? 0) + val);
  }
  return Array.from(byYear.entries())
    .map(([year, value]) => ({ year, value }))
    .sort((a, b) => b.year - a.year)
    .slice(0, 3);
}
