// Fiscal year: April 1 – March 31
export function getFiscalYearRange(referenceDate: Date = new Date()) {
  const y = referenceDate.getMonth() >= 3 ? referenceDate.getFullYear() : referenceDate.getFullYear() - 1;
  const start = new Date(y, 3, 1);
  const end = new Date(y + 1, 2, 31);
  return { start, end, label: `FY ${y}/${String(y + 1).slice(2)}` };
}

export function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function getCurrentFiscalYearBounds(referenceDate: Date = new Date()) {
  const { start, end, label } = getFiscalYearRange(referenceDate);
  return { startStr: toDateStr(start), endStr: toDateStr(end), label };
}

// 1..4, Q1 = Apr-Jun
export function getCurrentFiscalQuarter(referenceDate: Date = new Date()) {
  const { start } = getFiscalYearRange(referenceDate);
  const monthsSinceStart =
    (referenceDate.getFullYear() - start.getFullYear()) * 12 + (referenceDate.getMonth() - start.getMonth());
  return Math.floor(monthsSinceStart / 3) + 1;
}

// Includes the current quarter
export function remainingFiscalQuarters(referenceDate: Date = new Date()) {
  return 4 - getCurrentFiscalQuarter(referenceDate) + 1;
}

// quartersAgo = 0 → current fiscal quarter, 1 → previous quarter, etc.
export function getFiscalQuarterBounds(quartersAgo: number = 0, referenceDate: Date = new Date()) {
  const { start: fyStart } = getFiscalYearRange(referenceDate);
  const currentQ = getCurrentFiscalQuarter(referenceDate); // 1..4
  const targetIndex = currentQ - 1 - quartersAgo; // 0-based offset from FY start, can go negative
  const start = new Date(fyStart.getFullYear(), fyStart.getMonth() + targetIndex * 3, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
  const qNum = (((targetIndex % 4) + 4) % 4) + 1;
  return { start, end, startStr: toDateStr(start), endStr: toDateStr(end), label: `Q${qNum} ${start.getFullYear()}` };
}
