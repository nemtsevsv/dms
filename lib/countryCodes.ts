// Country name → ISO 3166-1 alpha-2 code, for the markets this
// distributor operates in. Falls back to the first two letters of the
// name (uppercased) for anything not in the list, rather than showing
// nothing.
const COUNTRY_CODES: Record<string, string> = {
  Kazakhstan: "KZ",
  Armenia: "AM",
  Uzbekistan: "UZ",
  Kyrgyzstan: "KG",
  Georgia: "GE",
  Azerbaijan: "AZ",
  Tajikistan: "TJ",
  Turkmenistan: "TM",
  Mongolia: "MN",
  Russia: "RU",
};

export function countryCode(countryName: string | null | undefined): string {
  if (!countryName) return "—";
  const trimmed = countryName.trim();
  if (COUNTRY_CODES[trimmed]) return COUNTRY_CODES[trimmed];
  // Loose match in case of extra whitespace/casing differences.
  const found = Object.keys(COUNTRY_CODES).find((k) => k.toLowerCase() === trimmed.toLowerCase());
  if (found) return COUNTRY_CODES[found];
  return trimmed.slice(0, 2).toUpperCase();
}
