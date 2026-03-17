"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";

type MissedAppointment = {
  id: string;
  title: string;
  date: Date | string;
  time: string;
  location: string | null;
};

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = Number.parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const dateStr = date.toISOString().slice(0, 10);
  if (dateStr === todayStr) return "today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  if (dateStr === yesterdayStr) return "yesterday";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export function MissedAppointmentsSection({
  appointments,
}: {
  readonly appointments: readonly MissedAppointment[];
}) {
  const router = useRouter();

  async function markCompleted(id: string) {
    const res = await fetch(`/api/v1/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
      credentials: "include",
    });
    if (res.ok) {
      toast.success("Marked as completed");
      router.refresh();
    } else {
      toast.error("Failed to update");
    }
  }

  return (
    <section className="bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50 p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-900 dark:text-amber-100 mb-4">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden />
        Missed appointments
      </h2>
      <ul className="space-y-3">
        {appointments.map((apt) => (
          <li
            key={apt.id}
            className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-white dark:bg-slate-900/50 border border-amber-100 dark:border-amber-900/50"
          >
            <div className="min-w-0">
              <span className="font-medium text-slate-900 dark:text-white">
                {apt.title}
              </span>
              <span className="block text-sm text-slate-500 dark:text-slate-400">
                {formatTime(apt.time)} {formatDate(apt.date)}
                {apt.location && ` · ${apt.location}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => markCompleted(apt.id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-3.5 h-3.5" aria-hidden />
                Mark completed
              </button>
              <Link
                href={`/dashboard/appointments/${apt.id}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Calendar className="w-3.5 h-3.5" aria-hidden />
                Reschedule
              </Link>
              <DeleteAppointmentButton appointmentId={apt.id} title={apt.title} onDeleted={() => router.refresh()} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DeleteAppointmentButton({
  appointmentId,
  title,
  onDeleted,
}: {
  readonly appointmentId: string;
  readonly title: string;
  readonly onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    setOpen(false);
    const res = await fetch(`/api/v1/appointments/${appointmentId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      toast.success("Appointment deleted");
      onDeleted();
    } else {
      toast.error("Failed to delete");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
      >
        <Trash2 className="w-3.5 h-3.5" aria-hidden />
        Delete
      </button>
      <ConfirmDialog
        open={open}
        title="Delete appointment"
        message={`Are you sure you want to delete "${title}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
