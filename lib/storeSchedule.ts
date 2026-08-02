export type ScheduleRow = { day_of_week: number; is_open: boolean; open_time: string | null; close_time: string | null };

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function hoursForDay(schedule: ScheduleRow[], dayOfWeek: number): number {
  const row = schedule.find((s) => s.day_of_week === dayOfWeek);
  if (!row || !row.is_open || !row.open_time || !row.close_time) return 0;
  const [oh, om] = row.open_time.split(":").map(Number);
  const [ch, cm] = row.close_time.split(":").map(Number);
  const hours = ch + cm / 60 - (oh + om / 60);
  return hours > 0 ? hours : 0;
}

export function hoursForDate(schedule: ScheduleRow[], date: Date): number {
  return hoursForDay(schedule, date.getDay());
}

// Number of days the store is scheduled to be open in a given month.
export function openDaysInMonth(schedule: ScheduleRow[], year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    if (hoursForDate(schedule, date) > 0) count++;
  }
  return count;
}

export function defaultSchedule(): { day_of_week: number; is_open: boolean; open_time: string; close_time: string }[] {
  // Sensible default: open every day 09:00-18:00, editable afterwards.
  return Array.from({ length: 7 }, (_, day_of_week) => ({
    day_of_week,
    is_open: true,
    open_time: "09:00",
    close_time: "18:00",
  }));
}
