export type Profile = { email: string | null; first_name?: string | null; last_name?: string | null };

export function formatProfileName(p?: Profile | null, fallbackEmail?: string | null): string {
  if (p) {
    const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
    if (name) return name;
    if (p.email) return p.email;
  }
  return fallbackEmail ?? "—";
}

// Builds an email → "First Last" lookup from a list of profile rows.
export function buildAuthorNameMap(profiles: Profile[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const p of profiles) {
    const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
    if (p.email && name) map[p.email] = name;
  }
  return map;
}

export function resolveAuthor(email: string | null | undefined, authorNames: Record<string, string>): string {
  if (!email) return "—";
  return authorNames[email] ?? email;
}
