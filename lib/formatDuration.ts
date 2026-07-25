export function formatDuration(fromDate: string | null | undefined): string {
  if (!fromDate) return "—";
  const from = new Date(fromDate);
  const now = new Date();
  let days = Math.floor((now.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) days = 0;

  if (days < 1) return "today";
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;

  const months = Math.floor(days / 30);
  const remDays = days % 30;
  if (months < 12) {
    return remDays > 0
      ? `${months} month${months === 1 ? "" : "s"} ${remDays}d`
      : `${months} month${months === 1 ? "" : "s"}`;
  }

  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths > 0
    ? `${years}y ${remMonths}m`
    : `${years} year${years === 1 ? "" : "s"}`;
}
