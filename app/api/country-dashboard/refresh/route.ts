import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStoreAccess } from "@/lib/storeAccess";
import { WORLD_BANK_FIELDS, GEONAMES_FIELDS, EUROSTAT_FIELDS } from "@/lib/countryDashboardFields";
import { fetchWorldBankIndicator, fetchGeoNamesTopCities, fetchEurostatExport } from "@/lib/countryDataSources";

export const maxDuration = 60; // Eurostat calls in particular can be slow

export async function POST(req: NextRequest) {
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

  // ---- World Bank — expected to be reliable ----
  for (const field of WORLD_BANK_FIELDS) {
    try {
      const values = await fetchWorldBankIndicator(iso2, field.wbIndicator!);
      for (const v of values) {
        rowsToInsert.push({ iso2, data_field: field.key, year: v.year, value: v.value, source: "World Bank", created_by: access.email });
      }
      if (values.length > 0) summary.worldBank.ok++;
      else summary.worldBank.failed++, summary.worldBank.errors.push(`${field.key}: no data returned`);
    } catch (e: any) {
      summary.worldBank.failed++;
      summary.worldBank.errors.push(`${field.key}: ${e.message}`);
    }
  }

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

  // ---- Eurostat — experimental, isolated per field so one bad call
  // never blocks the rest ----
  for (const field of EUROSTAT_FIELDS) {
    try {
      const values = await fetchEurostatExport(iso2, field.cnCode!, field.reporter!);
      for (const v of values) {
        rowsToInsert.push({ iso2, data_field: field.key, year: v.year, value: v.value, source: "Eurostat Comext", created_by: access.email });
      }
      if (values.length > 0) summary.eurostat.ok++;
      else summary.eurostat.failed++, summary.eurostat.errors.push(`${field.key}: no data returned`);
    } catch (e: any) {
      summary.eurostat.failed++;
      summary.eurostat.errors.push(`${field.key}: ${e.message}`);
    }
  }

  if (rowsToInsert.length > 0) {
    const { error } = await supabase.from("country_data_points").insert(rowsToInsert);
    if (error) {
      return NextResponse.json({ error: `Saved 0 rows — database error: ${error.message}`, summary }, { status: 500 });
    }
  }

  return NextResponse.json({ savedRows: rowsToInsert.length, summary });
}
