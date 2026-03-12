"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type View = "month" | "week" | "day";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function CalendarPage() {
  const [view, setView] = useState<View>("month");
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  });
  const [appointments, setAppointments] = useState<Record<string, number>>({});

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const start = new Date(cursor.year, cursor.month, 1);
    const end = new Date(cursor.year, cursor.month + 1, 0);
    const res = await fetch(
      `/api/v1/appointments?start=${start.toISOString().slice(0, 10)}&end=${end.toISOString().slice(0, 10)}`,
      { credentials: "include" }
    );
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    const counts: Record<string, number> = {};
    for (const a of data) {
      const key = new Date(a.date).toISOString().slice(0, 10);
      counts[key] = (counts[key] || 0) + 1;
    }
    setAppointments(counts);
    setLoading(false);
  }, [cursor.year, cursor.month]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

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
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          ← Dashboard
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
              ←
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
              →
            </button>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {MONTHS[cursor.month]} {cursor.year}
          </h2>
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
                const count = appointments[key] || 0;
                const isToday = key === todayKey;

                return (
                  <div
                    key={key}
                    className={`min-h-[80px] p-2 bg-white dark:bg-slate-900 ${
                      isToday ? "ring-2 ring-blue-500 rounded" : ""
                    }`}
                  >
                    <Link
                      href={`/dashboard/appointments/new?date=${key}`}
                      className="block text-right text-slate-900 dark:text-white font-medium hover:text-blue-600"
                    >
                      {d}
                    </Link>
                    {count > 0 && (
                      <span className="block mt-1 text-xs text-blue-600 dark:text-blue-400">
                        {count} appointment{count > 1 ? "s" : ""}
                      </span>
                    )}
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
