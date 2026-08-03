// A store's "today" must be computed in ITS OWN local time, not the
// server's (Vercel runs UTC). Without this, for a few hours after local
// midnight the server still thinks it's "yesterday" — reports stay stuck
// on the previous date, KPIs look wrong, etc.

export function getStoreDateStr(timezone: string, ref: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD, which is exactly what we store/compare against.
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone || "UTC" }).format(ref);
}

// A Date object that, when read with the LOCAL (server) getters
// (getFullYear/getMonth/getDate/getDay), reflects the store's calendar
// date — used everywhere we already do date-only arithmetic like
// `new Date(dateStr)` on a "YYYY-MM-DD" string (which the JS spec parses
// as UTC midnight, and server-side getters run in UTC on Vercel, so this
// stays consistent with the rest of the codebase).
export function getStoreDate(timezone: string, ref: Date = new Date()): Date {
  return new Date(getStoreDateStr(timezone, ref));
}

export const DEFAULT_STORE_TIMEZONE = "Asia/Almaty";

export const COMMON_TIMEZONES = [
  "Asia/Almaty",
  "Asia/Yerevan",
  "Asia/Tashkent",
  "Asia/Bishkek",
  "Asia/Baku",
  "Asia/Tbilisi",
  "Asia/Dushanbe",
  "Asia/Ashgabat",
  "Europe/Moscow",
  "UTC",
];
