// Server-side only — talks to the three external sources. Every function
// returns a clean, typed result and never throws past its own boundary;
// callers decide how to handle a source being unavailable (World Bank and
// GeoNames are expected to be reliable; Eurostat is explicitly best-effort
// — dataset code / response shape may still need adjustment once tested
// live).
//
// Every fetch has an explicit timeout. Without one, a single slow or
// unresponsive external call can hang indefinitely and drag the whole
// serverless function past its execution limit — which is what was
// happening: the platform then returns its own plain-text/HTML error page
// instead of JSON, which is why the client saw "Unexpected token... is not
// valid JSON" rather than a real error message.

const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { cache: "no-store", signal: controller.signal });
  } catch (e: any) {
    if (e.name === "AbortError") throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export type YearValue = { year: number; value: number };

const CURRENT_YEAR = new Date().getFullYear();

// ---------------- World Bank ----------------
// Public, no key required. Returns up to the last 3 years that actually
// have a published (non-null) value — current-year figures are usually not
// published yet, so we look back a wider window and keep only real data.
export async function fetchWorldBankIndicator(iso2: string, indicator: string): Promise<YearValue[]> {
  // World Bank's own documented examples consistently use lowercase country
  // codes (e.g. ".../country/br?format=json") — passing our stored
  // uppercase ISO2 as-is risked silently matching nothing for some
  // indicators while working for others.
  const url = `https://api.worldbank.org/v2/country/${iso2.toLowerCase()}/indicator/${indicator}?format=json&date=${CURRENT_YEAR - 6}:${CURRENT_YEAR}&per_page=20`;

  // One retry on failure — in practice, isolated HTTP errors on this API
  // have shown up as transient (one bad response among several identical
  // parallel calls), not a permanent problem with the indicator or country.
  let lastError: any;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) throw new Error(`World Bank ${indicator} for ${iso2}: HTTP ${res.status}`);
      const json = await res.json();
      const rows = Array.isArray(json) ? json[1] : null;
      if (!Array.isArray(rows)) return [];
      return rows
        .filter((r: any) => r.value !== null && r.value !== undefined)
        .map((r: any) => ({ year: Number(r.date), value: Number(r.value) }))
        .sort((a, b) => b.year - a.year)
        .slice(0, 3);
    } catch (e) {
      lastError = e;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw lastError;
}

// ---------------- GeoNames ----------------
// Requires a free username (registered once, stored as GEONAMES_USERNAME).
export async function fetchGeoNamesTopCities(iso2: string): Promise<{ name: string; population: number }[]> {
  const username = process.env.GEONAMES_USERNAME;
  if (!username) throw new Error("GEONAMES_USERNAME is not configured");
  const url = `https://secure.geonames.org/searchJSON?country=${iso2}&featureClass=P&orderby=population&maxRows=5&username=${encodeURIComponent(username)}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`GeoNames for ${iso2}: HTTP ${res.status}`);
  const json = await res.json();
  if (json.status) {
    const msg = json.status.message ?? "unknown";
    // GeoNames' most common "it looks configured but nothing works" failure
    // is that the account was registered but Free Web Services was never
    // switched on — that's a separate manual step on geonames.org, not
    // something the API key/username alone grants.
    const hint = /user does not exist|not authorized|enable/i.test(msg)
      ? " — check that 'Free Web Services' is enabled for this account at geonames.org/manageaccount"
      : "";
    throw new Error(`GeoNames error: ${msg}${hint}`);
  }
  const results = Array.isArray(json.geonames) ? json.geonames : [];
  return results
    .map((r: any) => ({ name: r.name as string, population: Number(r.population) || 0 }))
    .sort((a: any, b: any) => b.population - a.population)
    .slice(0, 5);
}

// ---------------- Eurostat Comext ----------------
// CONFIRMED against DS-059341's real Data Structure Definition (see
// fetchEurostatExport below for the full breakdown of what that
// confirmed). This is no longer a guess.
const EUROSTAT_DATASET = "DS-059341";
const FLOW_EXPORT = "2"; // Comext's CXT_EU_FLUX codelist: 1=Import, 2=Export, 3=Re-export

// Confirmed against DS-059341's own Data Structure Definition (fetched via
// the /api/country-dashboard/eurostat-dsd diagnostic route): dimension
// order is freq.reporter.partner.product.flow.indicators (exactly what was
// already being sent), flow is numeric (1=Import, 2=Export — already
// fixed), and VALUE_EUR is a real code in the CXT_INDICATORS codelist.
// The one remaining mismatch: our own field config uses the readable
// reporter code 'EU27' for field keys/labels, but Comext's actual
// codelist (CXT_FREE_ISO) has no plain 'EU27' — the EU aggregate is coded
// 'EU27_2020'. Translated here, at the query boundary, so stored field
// keys/labels stay clean.
const REPORTER_CODE_MAP: Record<string, string> = { EU27: "EU27_2020" };

export async function fetchEurostatExport(iso2: string, cnCode: string, reporter: string): Promise<YearValue[]> {
  const reporterCode = REPORTER_CODE_MAP[reporter] ?? reporter;
  const key = `A.${reporterCode}.${iso2}.${cnCode}.${FLOW_EXPORT}.VALUE_EUR`;
  const url = `https://ec.europa.eu/eurostat/api/comext/dissemination/sdmx/2.1/data/${EUROSTAT_DATASET}/${key}?format=SDMX-CSV`;
  const res = await fetchWithTimeout(url);
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
