import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
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

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { todaysAppointments, upcomingAppointments, tasks } =
    await getDashboardData(user.id);

  const pendingTasks = tasks.filter((t) => !t.completed);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <div className="flex gap-3">
          <Link
            href="/dashboard/calendar"
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Calendar
          </Link>
          <Link
            href="/dashboard/appointments/new"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            New Appointment
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Today&apos;s Appointments
          </h2>
          {todaysAppointments.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              No appointments today. Create one to get started.
            </p>
          ) : (
            <ul className="space-y-3">
              {todaysAppointments.map((apt) => (
                <li key={apt.id}>
                  <Link
                    href={`/dashboard/appointments/${apt.id}`}
                    className="block p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="font-medium text-slate-900 dark:text-white">
                      {apt.title}
                    </span>
                    <span className="block text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatTime(apt.time)}
                      {apt.location && ` · ${apt.location}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Upcoming
          </h2>
          {upcomingAppointments.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              No upcoming appointments.
            </p>
          ) : (
            <ul className="space-y-3">
              {upcomingAppointments.slice(0, 5).map((apt) => (
                <li key={apt.id}>
                  <Link
                    href={`/dashboard/appointments/${apt.id}`}
                    className="block p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="font-medium text-slate-900 dark:text-white">
                      {apt.title}
                    </span>
                    <span className="block text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatDate(apt.date)} · {formatTime(apt.time)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Tasks
          </h2>
          <Link
            href="/dashboard/tasks"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            View all
          </Link>
        </div>
        {tasks.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No tasks yet. Add a task to stay organized.
          </p>
        ) : (
          <ul className="space-y-2">
            {tasks.slice(0, 5).map((task) => (
              <li key={task.id}>
                <Link
                  href="/dashboard/tasks"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span
                    className={`flex-shrink-0 w-4 h-4 rounded border ${
                      task.completed
                        ? "bg-green-500 border-green-500"
                        : "border-slate-400"
                    }`}
                    aria-hidden
                  />
                  <span
                    className={
                      task.completed
                        ? "text-slate-500 dark:text-slate-400 line-through"
                        : "text-slate-900 dark:text-white"
                    }
                  >
                    {task.title}
                  </span>
                  {task.dueDate && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
