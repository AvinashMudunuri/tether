import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { logger } from "@/lib/logger";
import { getReminderTimeUtcMs, type ReminderType } from "@/lib/reminders";

/**
 * Creates reminders with explicit timestamps and schedules Inngest events.
 * Flow: User creates appointment → generate timestamps → create DB rows → schedule Inngest events.
 */
export async function scheduleRemindersForAppointment(
  appointmentId: string,
  reminderTypes: ReminderType[],
  dateStr: string,
  timeStr: string,
  timezoneOffset: number | null
) {
  logger.info("scheduleReminders: start", {
    appointmentId,
    reminderTypes,
    dateStr,
    timeStr,
    timezoneOffset,
  });

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!appointment) {
    logger.warn("scheduleReminders: appointment not found", { appointmentId });
    return;
  }
  if (["cancelled", "missed", "completed"].includes(appointment.status)) {
    logger.info("scheduleReminders: skipping - appointment not scheduled", {
      appointmentId,
      status: appointment.status,
    });
    return;
  }

  const now = Date.now();
  const events: { name: string; data: { reminderId: string }; ts: number }[] = [];

  for (const type of reminderTypes) {
    const reminderTimeMs = getReminderTimeUtcMs(
      dateStr,
      timeStr,
      timezoneOffset,
      type
    );
    if (reminderTimeMs <= now) {
      logger.info("scheduleReminders: skipping past reminder", {
        appointmentId,
        type,
        reminderTimeMs,
        now,
      });
      continue;
    }

    const reminder = await prisma.reminder.create({
      data: {
        appointmentId,
        type,
        reminderTime: new Date(reminderTimeMs),
      },
    });

    events.push({
      name: "reminder/send",
      data: { reminderId: reminder.id },
      ts: reminderTimeMs,
    });
  }

  if (events.length > 0) {
    try {
      await inngest.send(events);
      logger.info("scheduleReminders: events sent to Inngest", {
        appointmentId,
        count: events.length,
        eventIds: events.map((e) => e.data.reminderId),
      });
    } catch (err) {
      logger.error("scheduleReminders: inngest.send failed", {
        appointmentId,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  } else {
    logger.warn("scheduleReminders: no events to send (all reminders in past?)", {
      appointmentId,
      reminderTypes,
    });
  }
}

export async function rescheduleRemindersForAppointment(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { reminders: true },
  });

  if (!appointment) {
    logger.warn("rescheduleReminders: appointment not found", { appointmentId });
    return;
  }

  await prisma.reminder.deleteMany({
    where: { appointmentId, sent: false },
  });

  const typesToReschedule = appointment.reminders
    .filter((r) => !r.sent)
    .map((r) => r.type as ReminderType);
  const uniqueTypes = Array.from(new Set(typesToReschedule));
  const defaultTypes = ["1_hour", "30_min", "15_min"] as ReminderType[];
  const types = uniqueTypes.length > 0 ? uniqueTypes : defaultTypes;

  const dateStr = appointment.date.toISOString().slice(0, 10);
  await scheduleRemindersForAppointment(
    appointmentId,
    types,
    dateStr,
    appointment.time,
    appointment.timezoneOffset
  );
}
