"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Appointment = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string | null;
  attendees: string | null;
  notes: string | null;
  checklistItems: { id: string; label: string; checked: boolean; order: number }[];
};

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export function AppointmentDetail({ appointment }: { appointment: Appointment }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: appointment.title,
    date: appointment.date,
    time: appointment.time,
    location: appointment.location || "",
    attendees: appointment.attendees || "",
    notes: appointment.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [checklist, setChecklist] = useState(appointment.checklistItems);
  const [newChecklistLabel, setNewChecklistLabel] = useState("");
  const editTitleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && editTitleRef.current) {
      editTitleRef.current.focus();
    }
  }, [editing]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && editing) setEditing(false);
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editing]);

  async function handleSave() {
    setLoading(true);
    const res = await fetch(`/api/v1/appointments/${appointment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
      credentials: "include",
    });
    setLoading(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this appointment?")) return;
    await fetch(`/api/v1/appointments/${appointment.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    router.push("/dashboard");
    router.refresh();
  }

  async function toggleChecklist(id: string, checked: boolean) {
    await fetch(`/api/v1/checklist/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked }),
      credentials: "include",
    });
    setChecklist((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked } : i))
    );
    router.refresh();
  }

  async function addChecklistItem() {
    if (!newChecklistLabel.trim()) return;
    const res = await fetch("/api/v1/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: appointment.id,
        label: newChecklistLabel.trim(),
        order: checklist.length,
      }),
      credentials: "include",
    });
    if (res.ok) {
      const item = await res.json();
      setChecklist((prev) => [...prev, item]);
      setNewChecklistLabel("");
      router.refresh();
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6">
        {editing ? (
          <div
            className="space-y-4"
            role="form"
            aria-label="Edit appointment"
          >
            <label htmlFor="edit-title" className="sr-only">
              Title
            </label>
            <input
              ref={editTitleRef}
              id="edit-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full text-xl font-bold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Appointment title"
            />
            <div className="grid grid-cols-2 gap-4">
              <label htmlFor="edit-date" className="sr-only">
                Date
              </label>
              <input
                id="edit-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Appointment date"
              />
              <label htmlFor="edit-time" className="sr-only">
                Time
              </label>
              <input
                id="edit-time"
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Appointment time"
              />
            </div>
            <input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Location"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Location"
            />
            <input
              value={form.attendees}
              onChange={(e) => setForm((f) => ({ ...f, attendees: e.target.value }))}
              placeholder="Attendees"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Attendees"
            />
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Notes"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Notes"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={loading}
                aria-busy={loading}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                type="button"
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Cancel editing"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {appointment.title}
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {new Date(appointment.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              at {formatTime(appointment.time)}
            </p>
            {appointment.location && (
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                📍 {appointment.location}
              </p>
            )}
            {appointment.attendees && (
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                👥 {appointment.attendees}
              </p>
            )}
            {appointment.notes && (
              <p className="mt-3 text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                {appointment.notes}
              </p>
            )}

            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Checklist
              </h3>
              <div className="flex gap-2 mb-3">
                <label htmlFor="add-checklist" className="sr-only">
                  Add checklist item
                </label>
                <input
                  id="add-checklist"
                  type="text"
                  value={newChecklistLabel}
                  onChange={(e) => setNewChecklistLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
                  placeholder="Add item..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="New checklist item"
                />
                <button
                  onClick={addChecklistItem}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Add checklist item"
                >
                  Add
                </button>
              </div>
              {checklist.length > 0 ? (
                <ul className="space-y-2">
                  {checklist
                    .sort((a, b) => a.order - b.order)
                    .map((item) => (
                      <li key={item.id} className="flex items-center gap-2">
                        <button
                          onClick={() => toggleChecklist(item.id, !item.checked)}
                          className={`w-4 h-4 rounded border flex-shrink-0 ${
                            item.checked
                              ? "bg-green-500 border-green-500"
                              : "border-slate-400"
                          }`}
                          aria-label={item.checked ? "Uncheck" : "Check"}
                        />
                        <span
                          className={
                            item.checked
                              ? "text-slate-500 line-through"
                              : "text-slate-900 dark:text-white"
                          }
                        >
                          {item.label}
                        </span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No checklist items. Add one above.
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Edit appointment"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Delete appointment"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
