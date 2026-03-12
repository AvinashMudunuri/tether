import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProfileEditName } from "@/components/profile-edit-name";
import { ProfileSignOut } from "@/components/profile-sign-out";
import { ProfileNotificationSettings } from "@/components/profile-notification-settings";

function getInitials(user: { email?: string | null; user_metadata?: { full_name?: string } | null }): string {
  const name = user.user_metadata?.full_name?.trim();
  if (name) {
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = user.user_metadata?.full_name as string | undefined;
  const initials = getInitials(user);
  const notificationPrefs = (user.user_metadata?.notification_preferences as { emailReminders?: boolean } | undefined) ?? {};

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = new Date(todayStr + "T00:00:00.000Z");

  const [tasks, appointments, completedTasks, pastAppointments] = await Promise.all([
    prisma.task.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.appointment.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    }),
    prisma.task.findMany({
      where: { userId: user.id, completed: true },
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
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalAppointments = appointments.length;
  const pastCount = appointments.filter((a) => a.date < today).length;

  return (
    <div className="max-w-xl space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        ← Dashboard
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Profile
        </h1>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-xl font-medium text-white">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <ProfileEditName initialName={name || ""} />
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {user.email}
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-6 text-sm text-slate-600 dark:text-slate-400">
          {user.created_at && (
            <p>Account created: {formatDate(user.created_at)}</p>
          )}
          {user.last_sign_in_at && (
            <p>Last sign-in: {formatDate(user.last_sign_in_at)}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Reset password
          </Link>
          <ProfileSignOut />
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mb-6">
          <ProfileNotificationSettings initialPrefs={notificationPrefs} />
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Your activity
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalTasks}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Total tasks
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {completedCount}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Completed tasks
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalAppointments}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Total appointments
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {pastCount}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Past appointments
              </p>
            </div>
          </div>

          {completedTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Recent completed tasks
              </h3>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                {completedTasks.map((t) => (
                  <li key={t.id} className="line-through">
                    {t.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pastAppointments.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Recent past appointments
              </h3>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                {pastAppointments.map((a) => (
                  <li key={a.id}>
                    {a.title} · {formatDate(a.date)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
