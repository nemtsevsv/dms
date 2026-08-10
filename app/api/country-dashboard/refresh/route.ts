import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStoreAccess } from "@/lib/storeAccess";
import { WORLD_BANK_FIELDS, GEONAMES_FIELDS, EUROSTAT_FIELDS } from "@/lib/countryDashboardFields";
import { fetchWorldBankIndicator, fetchGeoNamesTopCities, fetchEurostatExport } from "@/lib/countryDataSources";

export const maxDuration = 60;

// Every external call now runs in parallel (was previously a sequential
// for-loop awaiting one field at a time — 20 external requests back to
// back easily exceeds a serverless function's execution limit, at which
// point the platform kills the function and returns its own plain-text
// error page instead of JSON; that's what produced "Unexpected token...
// is not valid JSON" on the client). The whole handler is also wrapped in
// a top-level try/catch so it can never return a non-JSON response, no
// matter what goes wrong.

export async function POST(req: NextRequest) {
  try {
    const access = await getStoreAccess();
    if (access.isStoreStaff || !access.email) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { iso2 } = await req.json();
    if (!iso2 || typeof iso2 !== "string") {
      return NextResponse.json({ error: "iso2 is required" }, { status: 400 });
    }

    const supabase = createClient();
    const rowsToInsert: any[] = [];
    const summary = {
      iso2,
      worldBank: { ok: 0, failed: 0, errors: [] as string[] },
      geonames: { ok: 0, failed: 0, errors: [] as string[] },
      eurostat: { ok: 0, failed: 0, errors: [] as string[] },
    };

    // ---- World Bank — all 7 indicators in parallel ----
    const wbResults = await Promise.allSettled(WORLD_BANK_FIELDS.map((field) => fetchWorldBankIndicator(iso2, field.wbIndicator!)));
    wbResults.forEach((result, i) => {
      const field = WORLD_BANK_FIELDS[i];
      if (result.status === "fulfilled") {
        if (result.value.length > 0) {
          summary.worldBank.ok++;
          for (const v of result.value) {
            rowsToInsert.push({ iso2, data_field: field.key, year: v.year, value: v.value, source: "World Bank", created_by: access.email });
          }
        } else {
          summary.worldBank.failed++;
          summary.worldBank.errors.push(`${field.key}: no data returned`);
        }
      } else {
        summary.worldBank.failed++;
        summary.worldBank.errors.push(`${field.key}: ${result.reason?.message ?? result.reason}`);
      }
    });

    // ---- GeoNames — one call covers all 10 city fields ----
    try {
      const cities = await fetchGeoNamesTopCities(iso2);
      cities.forEach((city, i) => {
        const n = i + 1;
        rowsToInsert.push({ iso2, data_field: `city_${n}_name`, year: null, text_value: city.name, source: "GeoNames", created_by: access.email });
        rowsToInsert.push({ iso2, data_field: `city_${n}_population`, year: null, value: city.population, source: "GeoNames", created_by: access.email });
      });
      summary.geonames.ok = cities.length;
      if (cities.length === 0) summary.geonames.errors.push("No populated places returned");
    } catch (e: any) {
      summary.geonames.failed = GEONAMES_FIELDS.length;
      summary.geonames.errors.push(e.message);
    }

    // ---- Eurostat — experimental, all 12 combos in parallel, each
    // isolated so one bad call never blocks the rest ----
    const euResults = await Promise.allSettled(EUROSTAT_FIELDS.map((field) => fetchEurostatExport(iso2, field.cnCode!, field.reporter!)));
    euResults.forEach((result, i) => {
      const field = EUROSTAT_FIELDS[i];
      if (result.status === "fulfilled") {
        if (result.value.length > 0) {
          summary.eurostat.ok++;
          for (const v of result.value) {
            rowsToInsert.push({ iso2, data_field: field.key, year: v.year, value: v.value, source: "Eurostat Comext", created_by: access.email });
          }
        } else {
          summary.eurostat.failed++;
          summary.eurostat.errors.push(`${field.key}: no data returned`);
        }
      } else {
        summary.eurostat.failed++;
        summary.eurostat.errors.push(`${field.key}: ${result.reason?.message ?? result.reason}`);
      }
    });

    if (rowsToInsert.length > 0) {
      const { error } = await supabase.from("country_data_points").insert(rowsToInsert);
      if (error) {
        return NextResponse.json({ error: `Saved 0 rows — database error: ${error.message}`, summary }, { status: 500 });
      }
    }

    // Returning the freshly fetched values themselves (not just the ok/failed
    // summary) lets a caller display them immediately, without a second
    // round trip to read them back out of country_data_points.
    const points = rowsToInsert.map((r) => ({ data_field: r.data_field, year: r.year, value: r.value, text_value: r.text_value }));

    return NextResponse.json({ savedRows: rowsToInsert.length, summary, points });
  } catch (e: any) {
    // Last-resort catch-all — guarantees the client always gets valid JSON
    // back, even for a genuinely unexpected failure.
    return NextResponse.json({ error: `Unexpected server error: ${e?.message ?? String(e)}` }, { status: 500 });
  }
}
