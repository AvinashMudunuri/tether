import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function isAppointmentTimePast(appointment: { date: Date; time: string }) {
  const [h, m] = appointment.time.split(":").map(Number);
  const aptDate = new Date(appointment.date);
  aptDate.setHours(h, m, 0, 0);
  return aptDate.getTime() < Date.now();
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const unsentReminders = await prisma.reminder.findMany({
    where: { sent: false },
    include: { appointment: true },
  });

  const supabase = createAdminClient();
  const results: { id: string; status: string }[] = [];

  for (const reminder of unsentReminders) {
    const apt = reminder.appointment;
    const aptDate = new Date(apt.date);
    const [h, m] = apt.time.split(":").map(Number);
    aptDate.setHours(h, m, 0, 0);
    const reminderDueAt = aptDate.getTime() - reminder.minutesBefore * 60 * 1000;

    if (Date.now() < reminderDueAt) continue;
    if (isAppointmentTimePast(apt)) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { sent: true, sentAt: new Date() },
      });
      results.push({ id: reminder.id, status: "skipped_past" });
      continue;
    }

    const { data: userData } = await supabase.auth.admin.getUserById(apt.userId);
    const email = userData?.user?.email;
    if (!email) {
      results.push({ id: reminder.id, status: "no_email" });
      continue;
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
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
        results.push({ id: reminder.id, status: "sent" });
        lastError = null;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
    if (lastError) {
      console.error(`Reminder ${reminder.id} failed:`, lastError);
      results.push({ id: reminder.id, status: "failed" });
    }
  }

  return Response.json({ processed: results.length, results });
}
