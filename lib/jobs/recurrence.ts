import type { RecurrenceRule } from "@/lib/types";

export interface Occurrence {
  start: Date;
  end: Date | null;
}

const DAY_MAP: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function addInterval(date: Date, freq: RecurrenceRule["freq"], interval: number): Date {
  const d = new Date(date);
  if (freq === "daily") d.setDate(d.getDate() + interval);
  if (freq === "weekly") d.setDate(d.getDate() + 7 * interval);
  if (freq === "monthly") d.setMonth(d.getMonth() + interval);
  return d;
}

export function generateOccurrences(
  rule: RecurrenceRule,
  firstStart: Date,
  firstEnd: Date | null,
  horizonMonths = 6,
): Occurrence[] {
  const horizon = rule.end_date
    ? new Date(rule.end_date + "T23:59:59")
    : new Date(firstStart.getFullYear(), firstStart.getMonth() + horizonMonths, firstStart.getDate());

  const occurrences: Occurrence[] = [];
  const durationMs = firstEnd ? firstEnd.getTime() - firstStart.getTime() : null;

  if (rule.freq === "weekly" && rule.days && rule.days.length > 0) {
    const targetDays = rule.days.map((d) => DAY_MAP[d]).filter((n) => n !== undefined);
    const weekStart = new Date(firstStart);
    weekStart.setDate(firstStart.getDate() - firstStart.getDay());
    weekStart.setHours(firstStart.getHours(), firstStart.getMinutes(), 0, 0);

    let cursor = new Date(weekStart);
    while (cursor <= horizon) {
      for (const dayNum of targetDays.sort((a, b) => a - b)) {
        const occStart = new Date(cursor);
        occStart.setDate(cursor.getDate() + dayNum - cursor.getDay());
        occStart.setHours(firstStart.getHours(), firstStart.getMinutes(), 0, 0);
        if (occStart >= firstStart && occStart <= horizon) {
          const occEnd = durationMs !== null ? new Date(occStart.getTime() + durationMs) : null;
          occurrences.push({ start: occStart, end: occEnd });
        }
      }
      cursor = addInterval(cursor, "weekly", rule.interval);
    }
  } else {
    let cursor = new Date(firstStart);
    while (cursor <= horizon) {
      const occEnd = durationMs !== null ? new Date(cursor.getTime() + durationMs) : null;
      occurrences.push({ start: new Date(cursor), end: occEnd });
      cursor = addInterval(cursor, rule.freq, rule.interval);
    }
  }

  return occurrences;
}
