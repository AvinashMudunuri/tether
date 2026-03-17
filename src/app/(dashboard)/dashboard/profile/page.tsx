import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  BarChart3,
  ListTodo,
  CheckCircle,
  Calendar,
  CalendarCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProfileEditName } from "@/components/profile-edit-name";
import { ProfileSignOut } from "@/components/profile-sign-out";
import { ProfileNotificationSettings } from "@/components/profile-notification-settings";

function getInitials(user: {
  email?: string | null;
  user_metadata?: { full_name?: string } | null;
}): string {
  const name = user.user_metadata?.full_name?.trim();
  if (name) {
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      const last = parts.at(-1);
      return (parts[0][0] + (last?.[0] ?? "")).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const email = user.email || "";
  const [local] = email.split("@");
  const domain = email.split("@")[1] || "";
  if (local && domain) {
    return (local[0] + domain[0]).toUpperCase();
  }
  return local?.slice(0, 2).toUpperCase() || "?";
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const cardClass =
  "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = user.user_metadata?.full_name as string | undefined;
  const initials = getInitials(user);
  const notificationPrefs = (user.user_metadata?.notification_preferences as {
    emailReminders?: boolean;
    smsReminders?: boolean;
    smsNumber?: string;
    whatsappReminders?: boolean;
    whatsappNumber?: string;
    pushNotifications?: boolean;
    fcmToken?: string;
  } | undefined) ?? {};

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = new Date(todayStr + "T00:00:00.000Z");

  const [tasks, appointments, completedTasks, pastAppointments] =
    await Promise.all([
      prisma.task.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.appointment.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
      }),
      prisma.task.findMany({
        where: { userId: user.id, status: "completed" },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.appointment.findMany({
        where: { userId: user.id, date: { lt: today } },
        orderBy: { date: "desc" },
        take: 5,
      }),
    ]);

  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalAppointments = appointments.length;
  const pastCount = appointments.filter((a) => a.date < today).length;

  return (
    <div className="max-w-4xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Dashboard
      </Link>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Left column: Identity + Account */}
        <div className="space-y-6">
          {/* Profile card */}
          <div className={cardClass}>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-2xl font-semibold text-white shadow-lg shadow-blue-500/20">
                {initials}
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <ProfileEditName initialName={name || ""} />
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
              {user.created_at && (
                <p>Joined {formatDate(user.created_at)}</p>
              )}
              {user.last_sign_in_at && (
                <p>Last sign-in {formatDate(user.last_sign_in_at)}</p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <KeyRound className="w-4 h-4" aria-hidden />
                Reset password
              </Link>
              <ProfileSignOut />
            </div>
          </div>
        </div>

        {/* Right column: Notifications + Activity */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className={cardClass}>
            <ProfileNotificationSettings initialPrefs={notificationPrefs} />
          </div>

          {/* Activity */}
          <div className={cardClass}>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
              <BarChart3
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                aria-hidden
              />
              Your activity
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <ListTodo
                  className="w-5 h-5 text-slate-500 dark:text-slate-400 mb-2"
                  aria-hidden
                />
                <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {totalTasks}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Tasks
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <CheckCircle
                  className="w-5 h-5 text-green-600 dark:text-green-400 mb-2"
                  aria-hidden
                />
                <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {completedCount}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Completed
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <Calendar
                  className="w-5 h-5 text-slate-500 dark:text-slate-400 mb-2"
                  aria-hidden
                />
                <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {totalAppointments}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Appointments
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <CalendarCheck
                  className="w-5 h-5 text-slate-500 dark:text-slate-400 mb-2"
                  aria-hidden
                />
                <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {pastCount}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Past
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {completedTasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Recent completed
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                    {completedTasks.map((t) => (
                      <li key={t.id} className="line-through truncate">
                        {t.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {pastAppointments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Recent past
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                    {pastAppointments.map((a) => (
                      <li key={a.id} className="truncate">
                        {a.title} · {formatDate(a.date)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
