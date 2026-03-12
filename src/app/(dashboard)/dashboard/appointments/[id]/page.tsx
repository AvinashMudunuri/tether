import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { AppointmentDetail } from "./appointment-detail";

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
    include: { checklistItems: true, reminders: true, attachments: true },
  });

  if (!appointment) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden />
        Back to dashboard
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
