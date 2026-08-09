import { NextResponse } from "next/server";
import { getStoreAccess } from "@/lib/storeAccess";

// One-off diagnostic — fetches the dataset's own Data Structure Definition
// (DSD) directly from Eurostat, which lists the real dimensions and their
// exact left-to-right order. This removes all guesswork about the SDMX
// key layout in countryDataSources.ts — visit this route from the live,
// deployed environment (it has real network access, unlike the sandbox
// this was developed in) and read the dimension list straight from the
// response. Not linked from any page — hit it directly by URL when needed.
export async function GET() {
  const access = await getStoreAccess();
  if (access.isStoreStaff || !access.email) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const url = "https://ec.europa.eu/eurostat/api/comext/dissemination/sdmx/2.1/datastructure/ESTAT/DS-059341?references=children";
  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") ?? "text/xml" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
