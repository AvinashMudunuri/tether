"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

type View = "month" | "week" | "day";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type AppointmentItem = { id: string; title: string; time: string; date: string };
type TaskItem = { id: string; title: string; dueDate: string | null; completed: boolean };

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const total = startPad + daysInMonth;
  const rows = Math.ceil(total / 7);
  const grid: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  const remainder = rows * 7 - grid.length;
  for (let i = 0; i < remainder; i++) grid.push(null);
  return grid;
}

function dateKey(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10);
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function CalendarPage() {
  const [view, setView] = useState<View>("month");
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  });
  const [appointmentsByDate, setAppointmentsByDate] = useState<Record<string, AppointmentItem[]>>({});
  const [tasksByDate, setTasksByDate] = useState<Record<string, TaskItem[]>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    const start = new Date(cursor.year, cursor.month, 1);
    const end = new Date(cursor.year, cursor.month + 1, 0);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const [appointmentsRes, tasksRes] = await Promise.all([
      fetch(`/api/v1/appointments?start=${startStr}&end=${endStr}`, { credentials: "include" }),
      fetch(`/api/v1/tasks?start=${startStr}&end=${endStr}`, { credentials: "include" }),
    ]);

    const aptByDate: Record<string, AppointmentItem[]> = {};
    if (appointmentsRes.ok) {
      const data = await appointmentsRes.json();
      for (const a of data) {
        const key = dateKey(a.date);
        if (!aptByDate[key]) aptByDate[key] = [];
        aptByDate[key].push({
          id: a.id,
          title: a.title,
          time: a.time,
          date: key,
        });
      }
    }
    setAppointmentsByDate(aptByDate);

    const tskByDate: Record<string, TaskItem[]> = {};
    if (tasksRes.ok) {
      const data = await tasksRes.json();
      for (const t of data) {
        if (!t.dueDate) continue;
        const key = new Date(t.dueDate).toISOString().slice(0, 10);
        if (!tskByDate[key]) tskByDate[key] = [];
        tskByDate[key].push({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          completed: t.completed,
        });
      }
    }
    setTasksByDate(tskByDate);
    setLoading(false);
  }, [cursor.year, cursor.month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const goPrev = () => {
    if (view === "month") {
      setCursor((c) =>
        c.month === 0 ? { year: c.year - 1, month: 11, day: 1 } : { ...c, month: c.month - 1 }
      );
    }
  };

  const goNext = () => {
    if (view === "month") {
      setCursor((c) =>
        c.month === 11 ? { year: c.year + 1, month: 0, day: 1 } : { ...c, month: c.month + 1 }
      );
    }
  };

  const goToday = () => {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth(), day: d.getDate() });
  };

  const monthDays = getMonthDays(cursor.year, cursor.month);
  const todayKey = dateKey(new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Calendar
        </h1>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Go to today"
            >
              Today
            </button>
            <button
              onClick={goNext}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" aria-hidden />
            </button>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {MONTHS[cursor.month]} {cursor.year}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500" aria-hidden />
              <span className="text-slate-600 dark:text-slate-400">Appointments</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500" aria-hidden />
              <span className="text-slate-600 dark:text-slate-400">Tasks</span>
            </div>
            <div className="flex gap-1">
              {(["month", "week", "day"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 rounded-lg text-sm capitalize ${
                    view === v
                      ? "bg-blue-600 text-white"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {view === "month" && (
          <div className="p-4">
            {loading ? (
              <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden animate-pulse">
                {DAYS.map((day) => (
                  <div key={day} className="bg-slate-50 dark:bg-slate-900 p-2 h-8" />
                ))}
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-900 min-h-[80px] p-2" />
                ))}
              </div>
            ) : (
            <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="bg-slate-50 dark:bg-slate-900 p-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                  {day}
                </div>
              ))}
              {monthDays.map((d, i) => {
                if (d === null) {
                  return (
                    <div
                      key={`e-${i}`}
                      className="bg-slate-50 dark:bg-slate-900 min-h-[80px] p-2"
                    />
                  );
                }
                const key = dateKey(new Date(cursor.year, cursor.month, d));
                const appointments = appointmentsByDate[key] || [];
                const tasks = tasksByDate[key] || [];
                const isToday = key === todayKey;

                return (
                  <div
                    key={key}
                    className={`min-h-[80px] p-2 bg-white dark:bg-slate-900 flex flex-col ${
                      isToday ? "ring-2 ring-blue-500 rounded" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <Link
                        href={`/dashboard/appointments/new?date=${key}`}
                        className="text-slate-900 dark:text-white font-medium hover:text-blue-600 text-right"
                        title="Add appointment"
                      >
                        {d}
                      </Link>
                    </div>
                    <div className="mt-1 space-y-0.5 overflow-hidden flex-1 min-h-0">
                      {appointments.slice(0, 3).map((apt, idx) => {
                        const aptColors = [
                          "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/60",
                          "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-800/60",
                          "bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200 hover:bg-violet-200 dark:hover:bg-violet-800/60",
                        ];
                        return (
                          <Link
                            key={apt.id}
                            href={`/dashboard/appointments/${apt.id}`}
                            className={`block text-xs truncate px-1 py-0.5 rounded ${aptColors[idx % aptColors.length]}`}
                            title={`${apt.title} at ${formatTime(apt.time)}`}
                          >
                            {apt.title}
                          </Link>
                        );
                      })}
                      {tasks.slice(0, 3).map((task) => (
                        <Link
                          key={task.id}
                          href={`/dashboard/tasks?date=${key}`}
                          className={`block text-xs truncate px-1 py-0.5 rounded ${
                            task.completed
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 line-through"
                              : "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800/60"
                          }`}
                          title={task.title}
                        >
                          {task.title}
                        </Link>
                      ))}
                      {(appointments.length > 3 || tasks.length > 3) && (
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          +{appointments.length + tasks.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {view === "week" && (
          <div className="p-4 text-slate-500 dark:text-slate-400 text-center">
            Weekly view coming soon
          </div>
        )}

        {view === "day" && (
          <div className="p-4 text-slate-500 dark:text-slate-400 text-center">
            Daily view coming soon
          </div>
        )}
      </div>
    </div>
  );
}
