import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStoreAccess } from "@/lib/storeAccess";
import { fetchEurostatExport } from "@/lib/countryDataSources";

export const maxDuration = 60;

// Same three reporters already used for the Country Dashboard's Eurostat
// fields — kept as readable country names here since trade_data's
// exporting_country column is free text matching country names elsewhere.
const REPORTERS: { code: string; name: string }[] = [
  { code: "EU27", name: "European Union" },
  { code: "DE", name: "Germany" },
  { code: "AT", name: "Austria" },
];

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

    const rowsToInsert: any[] = [];
    const errors: string[] = [];
    let ok = 0;

    const calls = hsCodes.flatMap((hs) => REPORTERS.map((r) => ({ hs, reporter: r })));
    const results = await Promise.allSettled(calls.map((c) => fetchEurostatExport(master.iso2, c.hs.hs_code, c.reporter.code)));

    results.forEach((result, i) => {
      const { hs, reporter } = calls[i];
      if (result.status === "fulfilled") {
        if (result.value.length > 0) {
          ok++;
          for (const v of result.value) {
            rowsToInsert.push({
              exporting_country: reporter.name,
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
        } else {
          errors.push(`${hs.hs_code} (${reporter.code}): no data returned`);
        }
      } else {
        errors.push(`${hs.hs_code} (${reporter.code}): ${(result as PromiseRejectedResult).reason?.message ?? "failed"}`);
      }
    });

    if (rowsToInsert.length > 0) {
      const { error } = await supabase.from("trade_data").insert(rowsToInsert);
      if (error) return NextResponse.json({ error: `Saved 0 rows — database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ savedRows: rowsToInsert.length, ok, failed: errors.length, errors: errors.slice(0, 10) });
  } catch (e: any) {
    return NextResponse.json({ error: `Unexpected server error: ${e?.message ?? String(e)}` }, { status: 500 });
  }
}
