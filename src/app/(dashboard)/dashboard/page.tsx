import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Calendar, CalendarPlus, Clock, CalendarDays, AlertTriangle, CheckCircle } from "lucide-react";
import { getDashboardData } from "@/lib/dashboard";
import { MissedAppointmentsSection } from "./missed-appointments-section";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
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

function isTimePassed(timeStr: string): boolean {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [h, m] = timeStr.split(":").map(Number);
  const aptMinutes = h * 60 + m;
  return nowMinutes > aptMinutes;
}

function formatDueLabel(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const dateStr = date.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  if (dateStr === todayStr) return "today";
  if (dateStr === yesterdayStr) return "yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const {
    todaysAppointments,
    upcomingAppointments,
    missedAppointments,
    tasks,
    overdueTasks,
    todaysTasks,
    completedTodayCount,
  } = await getDashboardData(user.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <div className="flex gap-3">
          <Link
            href="/dashboard/calendar"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Calendar className="w-4 h-4" aria-hidden />
            Calendar
          </Link>
          <Link
            href="/dashboard/appointments/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            <CalendarPlus className="w-4 h-4" aria-hidden />
            New Appointment
          </Link>
        </div>
      </div>

      {/* Today: Timeline */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden />
          Today
        </h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[280px]">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Appointments</h3>
            {todaysAppointments.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">No appointments today</p>
            ) : (
              <ul className="space-y-2">
                {todaysAppointments.map((apt) => {
                  const passed = isTimePassed(apt.time);
                  return (
                    <li key={apt.id}>
                      <Link
                        href={`/dashboard/appointments/${apt.id}`}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                          passed
                            ? "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <Calendar
                          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${passed ? "text-slate-400" : "text-blue-500"}`}
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <span className={`font-medium ${passed ? "text-slate-500" : "text-slate-900 dark:text-white"}`}>
                            {apt.title}
                          </span>
                          <span className={`block text-sm ${passed ? "text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>
                            {formatTime(apt.time)}
                            {apt.location && ` · ${apt.location}`}
                            {passed && <span className="ml-1.5 text-xs text-amber-600">(time passed)</span>}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="flex-1 min-w-[280px]">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Tasks</h3>
            {todaysTasks.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">No tasks due today</p>
            ) : (
              <ul className="space-y-2">
                {todaysTasks.slice(0, 5).map((task) => (
                  <li key={task.id}>
                    <Link
                      href="/dashboard/tasks"
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span
                        className={`flex-shrink-0 w-4 h-4 rounded border ${
                          task.status === "completed"
                            ? "bg-green-500 border-green-500"
                            : "border-slate-400"
                        }`}
                        aria-hidden
                      />
                      <span className={task.status === "completed" ? "text-slate-500 line-through" : "text-slate-900 dark:text-white"}>
                        {task.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Overdue */}
      {overdueTasks.length > 0 && (
        <section className="bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/50 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-red-900 dark:text-red-100 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden />
            Overdue Tasks
          </h2>
          <ul className="space-y-2">
            {overdueTasks.slice(0, 5).map((task) => (
              <li key={task.id}>
                <Link
                  href="/dashboard/tasks"
                  className="flex items-center gap-3 p-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <span className="flex-shrink-0 w-4 h-4 rounded border border-red-400" aria-hidden />
                  <span className="font-medium text-red-800 dark:text-red-200">{task.title}</span>
                  <span className="text-sm text-red-600 dark:text-red-400 ml-auto">
                    (due {formatDueLabel(task.dueDate!)})
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/tasks?filter=overdue"
            className="inline-block mt-3 text-sm text-red-600 hover:text-red-500 dark:text-red-400"
          >
            View all overdue →
          </Link>
        </section>
      )}

      {/* Upcoming */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden />
            Upcoming
          </h2>
          <Link
            href="/dashboard/appointments"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            View all
          </Link>
        </div>
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
                  className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500 dark:text-blue-400" aria-hidden />
                  <div className="min-w-0">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {apt.title}
                    </span>
                    <span className="block text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatDate(apt.date)} · {formatTime(apt.time)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {missedAppointments.length > 0 && (
        <MissedAppointmentsSection appointments={missedAppointments} />
      )}

      {/* Completed today + Tasks */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden />
            {completedTodayCount > 0 ? (
              <>Completed today: {completedTodayCount}</>
            ) : (
              "Tasks"
            )}
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
                      task.status === "completed"
                        ? "bg-green-500 border-green-500"
                        : "border-slate-400"
                    }`}
                    aria-hidden
                  />
                  <span
                    className={
                      task.status === "completed"
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
