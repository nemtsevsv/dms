// Single source of truth for every field the Country Dashboard displays —
// matches Country_Profile_Data_Dictionary_V1.xlsx field-for-field. Adding a
// new field means adding one entry here; nothing else in the app hardcodes
// the field list.

export type FieldSource = "worldbank" | "geonames" | "eurostat";

export type CountryField = {
  key: string; // stable key stored in country_data_points.data_field
  label: string;
  unit: string;
  source: FieldSource;
  isText?: boolean; // true for city names; everything else is numeric
  // World Bank
  wbIndicator?: string;
  // Eurostat Comext
  cnCode?: string;
  reporter?: string; // 'EU27' | 'DE' | 'AT'
};

export const WORLD_BANK_FIELDS: CountryField[] = [
  { key: "area_km2", label: "Area", unit: "km²", source: "worldbank", wbIndicator: "AG.SRF.TOTL.K2" },
  { key: "population", label: "Population", unit: "persons", source: "worldbank", wbIndicator: "SP.POP.TOTL" },
  { key: "population_growth_pct", label: "Population Growth", unit: "%", source: "worldbank", wbIndicator: "SP.POP.GROW" },
  { key: "urban_population_pct", label: "Urban Population", unit: "%", source: "worldbank", wbIndicator: "SP.URB.TOTL.IN.ZS" },
  { key: "gdp_usd", label: "GDP", unit: "USD", source: "worldbank", wbIndicator: "NY.GDP.MKTP.CD" },
  { key: "gdp_per_capita_usd", label: "GDP per Capita", unit: "USD/person", source: "worldbank", wbIndicator: "NY.GDP.PCAP.CD" },
  { key: "gdp_growth_pct", label: "GDP Growth", unit: "%", source: "worldbank", wbIndicator: "NY.GDP.MKTP.KD.ZG" },
];

export const GEONAMES_FIELDS: CountryField[] = [1, 2, 3, 4, 5].flatMap((n) => [
  { key: `city_${n}_name`, label: `Name of City ${n}`, unit: "text", source: "geonames" as const, isText: true },
  { key: `city_${n}_population`, label: `Population City ${n}`, unit: "persons", source: "geonames" as const },
]);

// Reporter/CN combinations exactly as specified in the Data Dictionary.
const EUROSTAT_COMBOS: { cn: string; reporter: string }[] = [
  { cn: "85258900", reporter: "EU27" },
  { cn: "85258900", reporter: "DE" },
  { cn: "90065380", reporter: "EU27" },
  { cn: "90065380", reporter: "DE" },
  { cn: "90021100", reporter: "EU27" },
  { cn: "90021100", reporter: "DE" },
  { cn: "90051000", reporter: "EU27" },
  { cn: "90051000", reporter: "DE" },
  { cn: "90051000", reporter: "AT" },
  { cn: "90131090", reporter: "EU27" },
  { cn: "90131090", reporter: "DE" },
  { cn: "90131090", reporter: "AT" },
];

export const EUROSTAT_FIELDS: CountryField[] = EUROSTAT_COMBOS.map((c) => ({
  key: `eu_export_${c.cn}_${c.reporter.toLowerCase()}`,
  label: `Export value for CN ${c.cn} ${c.reporter} Export`,
  unit: "EUR",
  source: "eurostat",
  cnCode: c.cn,
  reporter: c.reporter,
}));

export const ALL_COUNTRY_FIELDS: CountryField[] = [...WORLD_BANK_FIELDS, ...GEONAMES_FIELDS, ...EUROSTAT_FIELDS];

export function getField(key: string): CountryField | undefined {
  return ALL_COUNTRY_FIELDS.find((f) => f.key === key);
}
