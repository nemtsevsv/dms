// Builds a Monday-start month grid (array of weeks, each with 7 days),
// including the leading/trailing days from adjacent months needed to fill
// full weeks — the standard shape for an Outlook-style month view.
export function buildMonthGrid(year: number, month: number /* 1-12 */) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0=Mon .. 6=Sun
  const gridStart = new Date(year, month - 1, 1 - firstWeekday);

  const weeks: { date: Date; dateStr: string; inMonth: boolean }[][] = [];
  let cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week: { date: Date; dateStr: string; inMonth: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      week.push({
        date: new Date(cursor),
        dateStr: toDateStr(cursor),
        inMonth: cursor.getMonth() === month - 1,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    // Stop once we've filled the month and the next row would be entirely
    // outside it (keeps 5-row months at 5 rows, not a padded 6th row).
    if (cursor.getMonth() !== month - 1 && cursor > firstOfMonth) break;
  }
  return weeks;
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
