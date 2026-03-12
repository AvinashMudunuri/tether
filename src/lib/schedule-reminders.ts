import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";

const REMINDER_MINUTES = [60, 30, 15] as const;

export async function scheduleRemindersForAppointment(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { reminders: true },
  });

  if (!appointment) return;

  const aptDate = new Date(appointment.date);
  const [h, m] = appointment.time.split(":").map(Number);
  aptDate.setHours(h, m, 0, 0);
  const aptTimeMs = aptDate.getTime();

  const events = REMINDER_MINUTES.map((minutesBefore) => {
    const sendAt = aptTimeMs - minutesBefore * 60 * 1000;
    if (sendAt <= Date.now()) return null;

    const existing = appointment.reminders.find(
      (r) => r.minutesBefore === minutesBefore && !r.sent
    );
    const reminderId = existing?.id;

    if (!reminderId) return null;

    return {
      name: "reminder/send" as const,
      data: { reminderId },
      ts: sendAt,
      id: `reminder-${reminderId}`,
    };
  }).filter(Boolean) as { name: "reminder/send"; data: { reminderId: string }; ts: number; id: string }[];

  if (events.length > 0) {
    await inngest.send(events);
  }
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

  const aptDate = new Date(appointment.date);
  const [h, m] = appointment.time.split(":").map(Number);
  aptDate.setHours(h, m, 0, 0);
  const aptTimeMs = aptDate.getTime();

  const remindersToCreate = REMINDER_MINUTES.map((minutesBefore) => ({
    appointmentId,
    minutesBefore,
  }));

  const created: { id: string; minutesBefore: number }[] = [];
  for (const { appointmentId: aid, minutesBefore } of remindersToCreate) {
    const r = await prisma.reminder.create({
      data: { appointmentId: aid, minutesBefore },
    });
    created.push(r);
  }

  const events = created
    .map((reminder) => {
      const sendAt = aptTimeMs - reminder.minutesBefore * 60 * 1000;
      if (sendAt <= Date.now()) return null;
      return {
        name: "reminder/send" as const,
        data: { reminderId: reminder.id },
        ts: sendAt,
        id: `reminder-${reminder.id}`,
      };
    })
    .filter(Boolean) as { name: "reminder/send"; data: { reminderId: string }; ts: number; id: string }[];

  if (events.length > 0) {
    await inngest.send(events);
  }
}
