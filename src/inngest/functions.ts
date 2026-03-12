import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

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

export const sendReminder = inngest.createFunction(
  { id: "send-appointment-reminder", retries: 3 },
  { event: "reminder/send" },
  async ({ event }) => {
    const { reminderId } = event.data;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
    const aptDate = new Date(apt.date);
    const [h, m] = apt.time.split(":").map(Number);
    aptDate.setHours(h, m, 0, 0);
    if (aptDate.getTime() < Date.now()) {
      await prisma.reminder.update({
        where: { id: reminderId },
        data: { sent: true, sentAt: new Date() },
      });
      return { status: "skipped", reason: "appointment_past" };
    }

    const supabase = createAdminClient();
    const { data: userData } = await supabase.auth.admin.getUserById(apt.userId);
    const email = userData?.user?.email;
    if (!email) {
      return { status: "skipped", reason: "no_email" };
    }

    const prefs = userData?.user?.user_metadata?.notification_preferences as
      | { emailReminders?: boolean }
      | undefined;
    if (prefs?.emailReminders === false) {
      await prisma.reminder.update({
        where: { id: reminderId },
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
      where: { id: reminderId },
      data: { sent: true, sentAt: new Date() },
    });

    return { status: "sent" };
  }
);
