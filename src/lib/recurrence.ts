type AppointmentWithRecurrence = {
  id: string;
  date: Date;
  time: string;
  recurrenceType: string | null;
  recurrenceEndDate: Date | null;
  [key: string]: unknown;
};

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

function addWeeks(d: Date, weeks: number): Date {
  return addDays(d, weeks * 7);
}

function addMonths(d: Date, months: number): Date {
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function expandRecurringAppointments<T extends AppointmentWithRecurrence>(
  appointments: T[],
  startDate: Date,
  endDate: Date
): (T & { date: string })[] {
  const startKey = dateKey(startDate);
  const endKey = dateKey(endDate);
  const result: (T & { date: string })[] = [];

  for (const apt of appointments) {
    const aptDate = new Date(apt.date);
    const aptKey = dateKey(aptDate);

    if (!apt.recurrenceType || apt.recurrenceType === "none") {
      if (aptKey >= startKey && aptKey <= endKey) {
        result.push({ ...apt, date: aptKey });
      }
      continue;
    }

    const recurrenceEnd = apt.recurrenceEndDate
      ? new Date(apt.recurrenceEndDate)
      : endDate;
    const recurrenceEndKey = dateKey(recurrenceEnd);

    if (apt.recurrenceType === "weekly") {
      let current = new Date(aptDate);
      while (dateKey(current) <= recurrenceEndKey) {
        const key = dateKey(current);
        if (key >= startKey && key <= endKey) {
          result.push({ ...apt, date: key });
        }
        current = addWeeks(current, 1);
      }
    } else if (apt.recurrenceType === "monthly") {
      let current = new Date(aptDate);
      while (dateKey(current) <= recurrenceEndKey) {
        const key = dateKey(current);
        if (key >= startKey && key <= endKey) {
          result.push({ ...apt, date: key });
        }
        current = addMonths(current, 1);
      }
    }
  }

  return result.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}
