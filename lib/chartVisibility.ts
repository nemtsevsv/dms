// Shared rule for "is this period's data considered final enough to
// plot yet" — used by every chart that shows a Traffic line alongside
// sales bars. An in-progress month/day would otherwise show a
// misleadingly low bar (it just hasn't finished being reported yet), so
// each period gets a short buffer before it's plotted at all.

// A month becomes visible starting the 10th of the FOLLOWING month —
// this naturally also hides every future month (their "ready" date is
// even further out) with no separate future-check needed.
export function isMonthDataReady(monthDate: Date, today: Date = new Date()): boolean {
  const readyDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 10);
  return today >= readyDate;
}

// A day becomes visible starting the next calendar day — hides today
// (still in progress) and every future day.
export function isDayDataReady(dayDate: Date, today: Date = new Date()): boolean {
  const dayOnly = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return dayOnly < todayOnly;
}
