/**
 * Reminder types and utilities.
 * Types: 2_day, 1_day, 1_hour, 30_min, 15_min
 */

import { toUtcMs } from "./datetime";

export const REMINDER_TYPES = [
  { type: "2_day" as const, label: "2 days before", minutesBefore: 2880 },
  { type: "1_day" as const, label: "1 day before", minutesBefore: 1440 },
  { type: "1_hour" as const, label: "1 hour before", minutesBefore: 60 },
  { type: "30_min" as const, label: "30 minutes before", minutesBefore: 30 },
  { type: "15_min" as const, label: "15 minutes before", minutesBefore: 15 },
] as const;

export type ReminderType = (typeof REMINDER_TYPES)[number]["type"];

export function getReminderTimeUtcMs(
  dateStr: string,
  timeStr: string,
  timezoneOffset: number | null,
  type: ReminderType
): number {
  const aptUtcMs = toUtcMs(dateStr, timeStr, timezoneOffset);
  const def = REMINDER_TYPES.find((r) => r.type === type);
  if (!def) return aptUtcMs;
  return aptUtcMs - def.minutesBefore * 60 * 1000;
}

/**
 * Returns which reminder types are valid for an event at the given date/time.
 * E.g. event tomorrow 8 AM: 2 days and 1 day are invalid.
 */
export function getValidReminderTypes(
  dateStr: string,
  timeStr: string,
  timezoneOffset: number | null
): ReminderType[] {
  const now = Date.now();
  return REMINDER_TYPES.filter((r) => {
    const reminderMs = getReminderTimeUtcMs(dateStr, timeStr, timezoneOffset, r.type);
    return reminderMs > now;
  }).map((r) => r.type);
}
