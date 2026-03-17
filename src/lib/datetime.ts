/**
 * Converts date + time (user's local) to UTC timestamp.
 * @param dateStr YYYY-MM-DD
 * @param timeStr HH:mm
 * @param timezoneOffset minutes from Date.getTimezoneOffset() (e.g. -330 for IST).
 *   When null (e.g. older appointments), falls back to server timezone.
 */
export function toUtcMs(
  dateStr: string,
  timeStr: string,
  timezoneOffset: number | null | undefined
): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);
  const baseMs = Date.UTC(y, m - 1, d, h, min, 0, 0);
  const offset =
    timezoneOffset ?? new Date().getTimezoneOffset();
  const offsetMs = offset * 60 * 1000;
  return baseMs + offsetMs;
}
