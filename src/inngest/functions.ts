import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";
import { sendReminderSms } from "@/lib/sms";
import { sendPushNotification } from "@/lib/fcm";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { toUtcMs } from "@/lib/datetime";

type NotificationPrefs = {
  emailReminders?: boolean;
  smsReminders?: boolean;
  smsNumber?: string;
  whatsappReminders?: boolean;
  whatsappNumber?: string;
  pushNotifications?: boolean;
  fcmToken?: string;
};

/**
 * Event-triggered: sends a single reminder when Inngest fires at the scheduled time.
 * Replaces the 5-min cron that scanned all reminders.
 */
export const sendReminder = inngest.createFunction(
  { id: "send-reminder", retries: 2 },
  { event: "reminder/send" },
  async ({ event, step }) => {
    const { reminderId } = event.data;
    if (!reminderId) {
      logger.warn("sendReminder: missing reminderId", { event });
      return { status: "skipped", reason: "no_reminder_id" };
    }

    const reminder = await step.run("fetch-reminder", async () => {
      const r = await prisma.reminder.findUnique({
        where: { id: reminderId },
        include: { appointment: true },
      });
      if (!r) {
        logger.warn("sendReminder: reminder not found", { reminderId });
        return null;
      }
      if (r.sent) {
        logger.info("sendReminder: already sent", { reminderId });
        return { ...r, _skip: true };
      }
      if (["cancelled", "missed", "completed"].includes(r.appointment.status)) {
        logger.info("sendReminder: skipping - appointment not scheduled", {
          reminderId,
          status: r.appointment.status,
        });
        return { ...r, _skip: true };
      }
      return r;
    });

    if (!reminder) return { status: "skipped", reason: "not_found" };
    if ("_skip" in reminder && reminder._skip) return { status: "skipped", reason: "already_sent" };

    const result = await step.run("process-reminder", async () => {
      const normalized = {
        ...reminder,
        appointment: {
          ...reminder.appointment,
          date: typeof reminder.appointment.date === "string"
            ? new Date(reminder.appointment.date)
            : reminder.appointment.date,
        },
      };
      return processReminder(normalized);
    });

    logger.info("sendReminder: completed", {
      reminderId,
      appointmentId: reminder.appointmentId,
      status: result.status,
    });
    return result;
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
  const prefs = (userData?.user?.user_metadata?.notification_preferences as NotificationPrefs | undefined) ?? {};

  const wantEmail = prefs.emailReminders !== false;
  const wantSms =
    (prefs.smsReminders === true && prefs.smsNumber?.trim()) ||
    (prefs.whatsappReminders === true && prefs.whatsappNumber?.trim());
  const smsNumber = prefs.smsNumber?.trim() || prefs.whatsappNumber?.trim();
  const wantPush = prefs.pushNotifications === true && prefs.fcmToken?.trim();

  logger.info("processReminder: channels", {
    reminderId: reminder.id,
    wantEmail: wantEmail && !!email,
    wantSms,
    wantPush,
    hasFcmToken: !!prefs.fcmToken?.trim(),
    pushEnabled: prefs.pushNotifications === true,
  });

  if (!wantEmail && !wantSms && !wantPush) {
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { sent: true, sentAt: new Date() },
    });
    logger.info("processReminder: user disabled all channels", { reminderId: reminder.id });
    return { status: "skipped", reason: "user_disabled" };
  }

  const dateStr = formatDate(apt.date);
  const timeStr = formatTime(apt.time);
  const appointmentUrl = `${appUrl}/dashboard/appointments/${apt.id}`;
  let emailSent = false;
  let smsSent = false;
  let pushSent = false;

  if (wantEmail && email) {
    try {
      await sendReminderEmail({
        to: email,
        subject: `Reminder: ${apt.title}`,
        appointmentTitle: apt.title,
        date: dateStr,
        time: timeStr,
        location: apt.location || undefined,
        appointmentUrl,
      });
      emailSent = true;
      logger.info("processReminder: email sent", { reminderId: reminder.id });
    } catch (err) {
      logger.error("processReminder: email failed", {
        reminderId: reminder.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (wantSms && smsNumber) {
    try {
      await sendReminderSms({
        to: smsNumber,
        appointmentTitle: apt.title,
        date: dateStr,
        time: timeStr,
        location: apt.location || undefined,
        appointmentUrl,
      });
      smsSent = true;
      logger.info("processReminder: sms sent", { reminderId: reminder.id });
    } catch (err) {
      logger.error("processReminder: sms failed", {
        reminderId: reminder.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (wantPush && prefs.fcmToken) {
    try {
      logger.info("processReminder: sending push", { reminderId: reminder.id });
      await sendPushNotification({
        token: prefs.fcmToken.trim(),
        title: `Reminder: ${apt.title}`,
        body: apt.location
          ? `${dateStr} at ${timeStr} · ${apt.location}`
          : `${dateStr} at ${timeStr}`,
        url: appointmentUrl,
      });
      pushSent = true;
      logger.info("processReminder: push sent", { reminderId: reminder.id });
    } catch (err) {
      logger.error("processReminder: push failed", {
        reminderId: reminder.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  } else if (prefs.pushNotifications === true && !prefs.fcmToken?.trim()) {
    logger.warn("processReminder: push skipped (no FCM token - enable in Profile and allow permission)", {
      reminderId: reminder.id,
    });
  }

  const anySent = emailSent || smsSent || pushSent;
  if (anySent) {
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        sent: true,
        sentAt: new Date(),
        emailSent,
        smsSent,
        pushSent,
      },
    });
  }
  return {
    status: anySent ? "sent" : "failed",
    emailSent,
    smsSent,
    pushSent,
  };
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
  const hour = Number.parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

/**
 * Cron: runs hourly. Also triggerable via event for manual backfill.
 * Marks appointments as "missed" when their date+time has passed
 * (by at least 1 hour to avoid race with last-minute completions).
 */
export const markMissedAppointments = inngest.createFunction(
  { id: "mark-missed-appointments", retries: 1 },
  [
    { cron: "0 * * * *" },
    { event: "appointments/mark-missed" },
  ],
  async ({ step }) => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const result = await step.run("mark-missed", async () => {
      const appointments = await prisma.appointment.findMany({
        where: { status: "scheduled" },
        select: { id: true, date: true, time: true, timezoneOffset: true, title: true },
      });

      const toMark = appointments.filter((apt) => {
        const dateStr = apt.date.toISOString().slice(0, 10);
        const utcMs = toUtcMs(dateStr, apt.time, apt.timezoneOffset);
        return utcMs <= oneHourAgo;
      });

      for (const apt of toMark) {
        await prisma.appointment.update({
          where: { id: apt.id },
          data: { status: "missed" },
        });
        logger.info("markMissedAppointments: marked", { appointmentId: apt.id, title: apt.title });
      }

      return { marked: toMark.length, total: appointments.length };
    });

    return result;
  }
);
