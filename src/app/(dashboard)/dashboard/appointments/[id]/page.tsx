import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { AppointmentDetail } from "./appointment-detail";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default async function AppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { id } = await params;

  const appointment = await prisma.appointment.findFirst({
    where: { id, userId: user.id },
    include: { checklistItems: true, reminders: true },
  });

  if (!appointment) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        ← Back to dashboard
      </Link>

      <AppointmentDetail
        appointment={{
          ...appointment,
          date: appointment.date.toISOString().slice(0, 10),
        }}
      />
    </div>
  );
}
