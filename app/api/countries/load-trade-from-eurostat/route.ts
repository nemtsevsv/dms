import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStoreAccess } from "@/lib/storeAccess";
import { fetchEurostatExportForYears } from "@/lib/countryDataSources";
import { EU_COUNTRIES } from "@/lib/euCountries";

export const maxDuration = 60;

// Trade Overview's own loader — every individual EU member country as its
// own reporter (no EU27 aggregate, which would double-count against the
// per-country rows in any chart or total built from this table), covering
// 2014 through the current year. This is intentionally separate from
// fetchEurostatExport / the Country Dashboard's Eurostat fields, which
// keep their own existing behavior untouched.
const START_YEAR = 2014;
const CURRENT_YEAR = new Date().getFullYear();

export async function POST(req: NextRequest) {
  try {
    const access = await getStoreAccess();
    if (access.isStoreStaff || !access.email) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { countryId } = await req.json();
    if (!countryId) return NextResponse.json({ error: "countryId is required" }, { status: 400 });

    const supabase = createClient();
    const { data: country } = await supabase.from("countries").select("id, name").eq("id", countryId).single();
    if (!country) return NextResponse.json({ error: "Country not found" }, { status: 404 });

    const { data: master } = await supabase.from("country_master").select("iso2").ilike("country_en", country.name).maybeSingle();
    if (!master) {
      return NextResponse.json(
        { error: `No matching country in the reference list for the name "${country.name}" — check spelling matches the standard English name.` },
        { status: 404 }
      );
    }

    const { data: hsCodes } = await supabase.from("hs_codes").select("*").eq("eurostat_api", true);
    if (!hsCodes || hsCodes.length === 0) {
      return NextResponse.json({ error: "No HS codes are checked for Eurostat API in the HS Codes settings" }, { status: 400 });
    }

    // Look up every EU member's own ISO2 code — reusing the same reference
    // table Country Dashboard uses, rather than hardcoding a second list
    // that could drift out of sync with it.
    const { data: euMasters } = await supabase.from("country_master").select("iso2, country_en").in("country_en", EU_COUNTRIES);
    const reporters = Array.from(new Map((euMasters ?? []).map((m) => [m.iso2, m.country_en])).entries()); // dedupe (EU_COUNTRIES has both 'Czech Republic' and 'Czechia')
    if (reporters.length === 0) {
      return NextResponse.json({ error: "No EU member countries found in the country_master reference table" }, { status: 500 });
    }

    const rowsToInsert: any[] = [];
    const errors: string[] = [];
    let ok = 0;

    const calls = hsCodes.flatMap((hs) => reporters.map(([iso2, name]) => ({ hs, reporterIso2: iso2, reporterName: name })));
    const results = await Promise.allSettled(calls.map((c) => fetchEurostatExportForYears(master.iso2, c.reporterIso2, c.hs.hs_code, START_YEAR, CURRENT_YEAR)));

    results.forEach((result, i) => {
      const { hs, reporterName } = calls[i];
      if (result.status === "fulfilled") {
        if (result.value.length > 0) {
          ok++;
          for (const v of result.value) {
            rowsToInsert.push({
              exporting_country: reporterName,
              importing_country: country.name,
              product_group: hs.product_group,
              product: hs.product,
              hs_code: hs.hs_code,
              flow: "export",
              year: v.year,
              quantity: null,
              value: v.value,
              uploaded_by: access.email,
            });
          }
        }
      } else {
        errors.push(`${hs.hs_code} (${reporterName}): ${(result as PromiseRejectedResult).reason?.message ?? "failed"}`);
      }
    });

    if (rowsToInsert.length > 0) {
      const { error } = await supabase.from("trade_data").insert(rowsToInsert);
      if (error) return NextResponse.json({ error: `Saved 0 rows — database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      savedRows: rowsToInsert.length,
      ok,
      failed: errors.length,
      totalCombinations: calls.length,
      errors: errors.slice(0, 10),
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Unexpected server error: ${e?.message ?? String(e)}` }, { status: 500 });
  }
}
