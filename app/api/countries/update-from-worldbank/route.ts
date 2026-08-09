import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStoreAccess } from "@/lib/storeAccess";
import { fetchWorldBankIndicator } from "@/lib/countryDataSources";

// Updates the hand-maintained fields on the existing Countries record
// (area, population, population growth, GDP, GDP growth) from World Bank —
// the one legacy field this dictionary doesn't cover is GDP (PPP), which
// stays manual, along with HNWI/VAT/Capital/Biggest Cities.
export async function POST(req: NextRequest) {
  const access = await getStoreAccess();
  if (access.isStoreStaff || !access.email) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { countryId } = await req.json();
  if (!countryId) return NextResponse.json({ error: "countryId is required" }, { status: 400 });

  const supabase = createClient();
  const { data: country } = await supabase.from("countries").select("id, name").eq("id", countryId).single();
  if (!country) return NextResponse.json({ error: "Country not found" }, { status: 404 });

  const { data: master } = await supabase
    .from("country_master")
    .select("iso2")
    .ilike("country_en", country.name)
    .maybeSingle();
  if (!master) {
    return NextResponse.json(
      { error: `No matching country in the World Bank reference list for the name "${country.name}" — check spelling matches the standard English name.` },
      { status: 404 }
    );
  }

  try {
    const [area, population, popGrowth, gdp, gdpGrowth] = await Promise.all([
      fetchWorldBankIndicator(master.iso2, "AG.SRF.TOTL.K2"),
      fetchWorldBankIndicator(master.iso2, "SP.POP.TOTL"),
      fetchWorldBankIndicator(master.iso2, "SP.POP.GROW"),
      fetchWorldBankIndicator(master.iso2, "NY.GDP.MKTP.CD"),
      fetchWorldBankIndicator(master.iso2, "NY.GDP.MKTP.KD.ZG"),
    ]);

    const latest = (arr: { year: number; value: number }[]) => (arr.length > 0 ? arr[0].value : null);

    const update = {
      area: latest(area),
      population: latest(population),
      population_growth_rate: latest(popGrowth),
      gdp: latest(gdp),
      gdp_growth_rate: latest(gdpGrowth),
      updated_at: new Date().toISOString(),
    };

    await supabase.from("countries").update(update).eq("id", countryId);

    return NextResponse.json({ updated: update, iso2: master.iso2 });
  } catch (e: any) {
    return NextResponse.json({ error: `World Bank request failed: ${e.message}` }, { status: 502 });
  }
}
