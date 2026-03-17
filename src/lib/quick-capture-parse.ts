/**
 * MVP parsing for Quick Capture.
 * Keywords: today, tomorrow, tonight, monday-sunday, am, pm, next week
 * If text contains date/time keywords → appointment, else → task
 */

const DATE_KEYWORDS = [
  "today",
  "tomorrow",
  "tonight",
  "monday",
  "tuesday",
  "wednesday",
  "wed",
  "thursday",
  "thu",
  "friday",
  "fri",
  "saturday",
  "sat",
  "sunday",
  "sun",
  "next week",
] as const;

const TIME_KEYWORDS = ["am", "pm"];

const WEEKDAY_ORDER: { name: string; day: number }[] = [
  { name: "sunday", day: 0 },
  { name: "sun", day: 0 },
  { name: "monday", day: 1 },
  { name: "mon", day: 1 },
  { name: "tuesday", day: 2 },
  { name: "tue", day: 2 },
  { name: "wednesday", day: 3 },
  { name: "wed", day: 3 },
  { name: "thursday", day: 4 },
  { name: "thu", day: 4 },
  { name: "friday", day: 5 },
  { name: "fri", day: 5 },
  { name: "saturday", day: 6 },
  { name: "sat", day: 6 },
];

function hasDateOrTimeKeywords(text: string): boolean {
  const lower = text.toLowerCase().trim();
  for (const kw of DATE_KEYWORDS) {
    if (lower.includes(kw)) return true;
  }
  for (const kw of TIME_KEYWORDS) {
    if (lower.includes(kw)) return true;
  }
  // Also check for time patterns like 10am, 3pm, 7:30pm
  if (/\d{1,2}\s*(am|pm)/i.test(lower)) return true;
  if (/\d{1,2}:\d{2}\s*(am|pm)?/i.test(lower)) return true;
  return false;
}

function getDateFromKeyword(keyword: string): { dateStr: string; timeStr: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lower = keyword.toLowerCase();

  if (lower.includes("today")) {
    return {
      dateStr: formatDateStr(today),
      timeStr: lower.includes("tonight") ? "19:00" : "09:00",
    };
  }
  if (lower.includes("tonight")) {
    return {
      dateStr: formatDateStr(today),
      timeStr: "19:00",
    };
  }
  if (lower.includes("tomorrow")) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      dateStr: formatDateStr(tomorrow),
      timeStr: "09:00",
    };
  }
  if (lower.includes("next week")) {
    const nextMonday = new Date(today);
    const dayOfWeek = nextMonday.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    return {
      dateStr: formatDateStr(nextMonday),
      timeStr: "09:00",
    };
  }

  for (const { name: dayName, day: targetDay } of WEEKDAY_ORDER) {
    if (lower.includes(dayName)) {
      const next = new Date(today);
      const currentDay = next.getDay();
      let daysToAdd = (targetDay - currentDay + 7) % 7;
      if (daysToAdd === 0) daysToAdd = 7;
      next.setDate(next.getDate() + daysToAdd);
      return {
        dateStr: formatDateStr(next),
        timeStr: "09:00",
      };
    }
  }

  return {
    dateStr: formatDateStr(today),
    timeStr: "09:00",
  };
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function extractTime(text: string): string | null {
  const lower = text.toLowerCase();
  // 10am, 10 am, 3pm, 3 pm
  const match1 = /(\d{1,2})\s*(am|pm)/.exec(lower);
  if (match1) {
    let hour = Number.parseInt(match1[1], 10);
    const ampm = match1[2];
    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:00`;
  }
  // 10:30am, 3:45pm
  const match2 = /(\d{1,2}):(\d{2})\s*(am|pm)?/i.exec(lower);
  if (match2) {
    let hour = Number.parseInt(match2[1], 10);
    const min = match2[2];
    const ampm = match2[3] || (hour >= 12 ? "pm" : "am");
    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${min}`;
  }
  return null;
}

function extractTitleAndDatePhrase(text: string): { title: string; datePhrase: string } {
  const lower = text.toLowerCase().trim();
  let datePhrase = "";

  const patterns = [
    /\b(next week)\b/i,
    /\b(tomorrow|today|tonight)\b/i,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i,
    /\d{1,2}\s*(?:am|pm)\b/i,
    /\d{1,2}:\d{2}\s*(?:am|pm)?\b/i,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      datePhrase = match[0];
      break;
    }
  }

  let title = text;
  if (datePhrase) {
    const idx = lower.indexOf(datePhrase.toLowerCase());
    title = text.slice(0, idx).trim();
    const after = text.slice(idx + datePhrase.length).trim();
    if (after && /^\d|am|pm/i.test(after)) {
      datePhrase = `${datePhrase} ${after}`.trim();
    }
  }

  title = title.replaceAll(/\s+/g, " ").trim();
  if (!title) title = text.trim();

  return { title, datePhrase };
}

export type QuickCaptureParseResult =
  | { type: "task"; title: string; dueDate?: string }
  | { type: "appointment"; title: string; date: string; time: string; datePhrase: string };

export function parseQuickCapture(input: string): QuickCaptureParseResult | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 2) return null;

  if (!hasDateOrTimeKeywords(trimmed)) {
    return { type: "task", title: trimmed };
  }

  const { title, datePhrase } = extractTitleAndDatePhrase(trimmed);
  if (!title) return null;

  const { dateStr, timeStr } = getDateFromKeyword(datePhrase || "today");
  const extractedTime = extractTime(trimmed);
  const time = extractedTime || timeStr;

  return {
    type: "appointment",
    title,
    date: dateStr,
    time,
    datePhrase: datePhrase || "today",
  };
}

export function formatAppointmentPreview(dateStr: string, timeStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  let dateLabel: string;
  if (dateStr === todayStr) dateLabel = "Today";
  else if (dateStr === tomorrowStr) dateLabel = "Tomorrow";
  else dateLabel = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const [h, m] = timeStr.split(":");
  const hour = Number.parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  const timeLabel = `${h12}:${m} ${ampm}`;

  return `${dateLabel} ${timeLabel}`;
}
