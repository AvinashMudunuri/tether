import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { toUtcMs } from "@/lib/datetime";

function getAppointmentUtcMs(apt: { date: Date; time: string; timezoneOffset: number | null }) {
  const dateStr = apt.date.toISOString().slice(0, 10);
  return toUtcMs(dateStr, apt.time, apt.timezoneOffset);
}

// Cron runs every 5 min - processes due reminders (fallback when scheduled events don't trigger)
export const processDueReminders = inngest.createFunction(
  { id: "process-due-reminders", retries: 2 },
  { cron: "*/5 * * * *" },
  async ({ step }) => {
    const now = Date.now();
    const reminderIds = await step.run("fetch-due-reminders", async () => {
      const all = await prisma.reminder.findMany({
        where: { sent: false },
        include: { appointment: true },
      });
      return all
        .filter((r) => {
          const aptTimeMs = getAppointmentUtcMs(r.appointment);
          const sendAt = aptTimeMs - r.minutesBefore * 60 * 1000;
          return sendAt <= now;
        })
        .map((r) => r.id);
    });

    for (const reminderId of reminderIds) {
      await step.run(`send-reminder-${reminderId}`, async () => {
        const reminder = await prisma.reminder.findUnique({
          where: { id: reminderId },
          include: { appointment: true },
        });
        if (!reminder) return { status: "skipped", reason: "not_found" };
        return processReminder(reminder);
      });
    }
    return { processed: reminderIds.length };
  }
);

async function processReminder(reminder: {
  id: string;
  appointment: { id: string; userId: string; title: string; date: Date; time: string; location: string | null };
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const apt = reminder.appointment;
  const supabase = createAdminClient();
  const { data: userData } = await supabase.auth.admin.getUserById(apt.userId);
  const email = userData?.user?.email;
  if (!email) return { status: "skipped", reason: "no_email" };

  const prefs = userData?.user?.user_metadata?.notification_preferences as
    | { emailReminders?: boolean }
    | undefined;
  if (prefs?.emailReminders === false) {
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { sent: true, sentAt: new Date() },
    });
    return { status: "skipped", reason: "user_disabled" };
  }

  await sendReminderEmail({
    to: email,
    subject: `Reminder: ${apt.title}`,
    appointmentTitle: apt.title,
    date: formatDate(apt.date),
    time: formatTime(apt.time),
    location: apt.location || undefined,
    appointmentUrl: `${appUrl}/dashboard/appointments/${apt.id}`,
  });

  await prisma.reminder.update({
    where: { id: reminder.id },
    data: { sent: true, sentAt: new Date() },
  });
  return { status: "sent" };
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

// Event-based: triggered by reminder/send (scheduled via inngest.send)
export const sendReminder = inngest.createFunction(
  { id: "send-appointment-reminder", retries: 3 },
  { event: "reminder/send" },
  async ({ event }) => {
    const { reminderId } = event.data;
    const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
      include: { appointment: true },
    });

    if (!reminder || !reminder.appointment) {
      return { status: "skipped", reason: "reminder_or_appointment_not_found" };
    }

    if (reminder.sent) {
      return { status: "skipped", reason: "already_sent" };
    }

    const apt = reminder.appointment;
    const aptTimeMs = getAppointmentUtcMs(apt);
    if (aptTimeMs < Date.now()) {
      await prisma.reminder.update({
        where: { id: reminderId },
        data: { sent: true, sentAt: new Date() },
      });
      return { status: "skipped", reason: "appointment_past" };
    }

    return processReminder(reminder);
  }
);
