"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarPlus, Calendar } from "lucide-react";

type Appointment = {
  id: string;
  title: string;
  date: string;
  time: string;
  status: string;
  location: string | null;
};

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

function StatusBadge({ status }: { readonly status: string }) {
  const styles: Record<string, string> = {
    scheduled: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200",
    completed: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200",
    missed: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200",
    cancelled: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  };
  return (
    <span
      className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] ?? "bg-slate-100 dark:bg-slate-800"}`}
    >
      {status}
    </span>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "scheduled" | "completed" | "missed" | "cancelled">("all");

  useEffect(() => {
    async function fetchAppointments() {
      const res = await fetch("/api/v1/appointments", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAppointments(
          data.map((a: { id: string; title: string; date: string; time: string; status: string; location: string | null }) => ({
            id: a.id,
            title: a.title,
            date: a.date,
            time: a.time,
            status: a.status,
            location: a.location,
          }))
        );
      }
      setLoading(false);
    }
    fetchAppointments();
  }, []);

  const filtered =
    filter === "all"
      ? appointments
      : appointments.filter((a) => a.status === filter);

  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return a.time.localeCompare(b.time);
  });

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
          Appointments
        </h1>
        <Link
          href="/dashboard/appointments/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          <CalendarPlus className="w-4 h-4" aria-hidden />
          New Appointment
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div
          className="flex flex-wrap gap-2 mb-4"
          aria-label="Filter appointments"
        >
          {(["all", "scheduled", "completed", "missed", "cancelled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              aria-label={`Show ${f} appointments`}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">
            No appointments yet.{" "}
            <Link href="/dashboard/appointments/new" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Create one
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((apt) => (
              <li key={apt.id}>
                <Link
                  href={`/dashboard/appointments/${apt.id}`}
                  className={
                    apt.status === "cancelled" || apt.status === "completed"
                      ? "flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                      : "flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  }
                >
                  <Calendar className="w-4 h-4 flex-shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <span
                      className={
                        apt.status === "cancelled"
                          ? "text-slate-500 dark:text-slate-400 line-through"
                          : "font-medium text-slate-900 dark:text-white"
                      }
                    >
                      {apt.title}
                    </span>
                    <span className="block text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(apt.date)} · {formatTime(apt.time)}
                      {apt.location && ` · ${apt.location}`}
                    </span>
                  </div>
                  <StatusBadge status={apt.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
