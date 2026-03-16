import { prisma } from "@/lib/db";

const DEFAULT_REMINDER_MINUTES = [60, 30, 15];

/**
 * Reminders are created by the appointment POST. The cron (process-due-reminders)
 * runs every 5 min and sends due reminders. No scheduled events - more reliable.
 */
export async function scheduleRemindersForAppointment(appointmentId: string) {
  void appointmentId; // No-op: reminders already in DB, cron picks them up
}

export async function rescheduleRemindersForAppointment(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { reminders: true },
  });

  if (!appointment) return;

  await prisma.reminder.deleteMany({
    where: { appointmentId, sent: false },
  });

  const remindersToCreate = DEFAULT_REMINDER_MINUTES.map((minutesBefore) => ({
    appointmentId,
    minutesBefore,
  }));

  for (const { appointmentId: aid, minutesBefore } of remindersToCreate) {
    await prisma.reminder.create({
      data: { appointmentId: aid, minutesBefore },
    });
  }
  // Cron picks up when due - no events to send
}
