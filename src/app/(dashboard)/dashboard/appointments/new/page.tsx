"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { REMINDER_TYPES, getValidReminderTypes, type ReminderType } from "@/lib/reminders";

function getDefaultDate() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function getDefaultTime() {
  const d = new Date();
  const h = d.getHours();
  const m = Math.ceil(d.getMinutes() / 15) * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    date: getDefaultDate(),
    time: getDefaultTime(),
    location: "",
    attendees: "",
    notes: "",
    recurrenceType: "none" as "none" | "weekly" | "monthly",
    recurrenceEndDate: "",
    reminderTypes: ["1_hour", "30_min", "15_min"] as ReminderType[],
  });

  const validTypes = useMemo(
    () => getValidReminderTypes(form.date, form.time, new Date().getTimezoneOffset()),
    [form.date, form.time]
  );

  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      setForm((f) => ({ ...f, date: dateParam }));
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/v1/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        title: form.title,
        date: form.date,
        time: form.time,
        timezoneOffset: new Date().getTimezoneOffset(),
        location: form.location || undefined,
        attendees: form.attendees || undefined,
        notes: form.notes || undefined,
        recurrenceType: form.recurrenceType !== "none" ? form.recurrenceType : undefined,
        recurrenceEndDate: form.recurrenceEndDate || undefined,
        reminderTypes: form.reminderTypes,
      }),
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data.error || "Failed to create appointment";
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    toast.success("Appointment created");
    router.push(`/dashboard/appointments/${data.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-xl space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Back to dashboard
      </Link>

      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
        <CalendarPlus className="w-7 h-7 text-blue-600 dark:text-blue-400" aria-hidden />
        New Appointment
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4" aria-label="New appointment">
        {error && (
          <div
            className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-sm"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            placeholder="e.g. Doctor appointment"
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
            autoFocus
            aria-required="true"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Date *
            </label>
            <input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="time"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Time *
            </label>
            <input
              id="time"
              type="time"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Remind me
          </label>
          <div className="flex flex-wrap gap-2">
            {REMINDER_TYPES.map(({ type, label }) => {
              const isValid = validTypes.includes(type);
              return (
                <label
                  key={type}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    isValid
                      ? "border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed opacity-60"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.reminderTypes.includes(type)}
                    disabled={!isValid}
                    onChange={(e) => {
                      if (!isValid) return;
                      setForm((f) => ({
                        ...f,
                        reminderTypes: e.target.checked
                          ? [...f.reminderTypes, type].sort(
                              (a, b) =>
                                REMINDER_TYPES.findIndex((r) => r.type === b) -
                                REMINDER_TYPES.findIndex((r) => r.type === a)
                            )
                          : f.reminderTypes.filter((t) => t !== type),
                      }));
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {label}
                    {!isValid && " (past)"}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="recurrence"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Repeat
          </label>
          <select
            id="recurrence"
            value={form.recurrenceType}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                recurrenceType: e.target.value as "none" | "weekly" | "monthly",
              }))
            }
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="none">None</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {form.recurrenceType !== "none" && (
          <div>
            <label
              htmlFor="recurrenceEndDate"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              End date (optional)
            </label>
            <input
              id="recurrenceEndDate"
              type="date"
              value={form.recurrenceEndDate}
              onChange={(e) => setForm((f) => ({ ...f, recurrenceEndDate: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Location
          </label>
          <input
            id="location"
            type="text"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="e.g. 123 Main St"
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="attendees"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Attendees
          </label>
          <input
            id="attendees"
            type="text"
            value={form.attendees}
            onChange={(e) => setForm((f) => ({ ...f, attendees: e.target.value }))}
            placeholder="e.g. Dr. Smith, Mom"
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Notes
          </label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            placeholder="Additional notes..."
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
