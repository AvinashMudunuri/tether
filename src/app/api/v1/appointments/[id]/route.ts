import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized, notFound, badRequest } from "@/lib/api-auth";
import { rescheduleRemindersForAppointment } from "@/lib/schedule-reminders";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const appointment = await prisma.appointment.findFirst({
    where: { id, userId: user.id },
    include: { checklistItems: true, reminders: true, attachments: true },
  });

  if (!appointment) return notFound("Appointment not found");
  return Response.json(appointment);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const existing = await prisma.appointment.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return notFound("Appointment not found");

  let body: Partial<{ title: string; date: string; time: string; location: string; attendees: string; notes: string }>;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { title, date, time, location, attendees, notes } = body;

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(time !== undefined && { time: time.trim() }),
      ...(location !== undefined && { location: location?.trim() || null }),
      ...(attendees !== undefined && { attendees: attendees?.trim() || null }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
    },
    include: { checklistItems: true, reminders: true, attachments: true },
  });

  if (date !== undefined || time !== undefined) {
    await rescheduleRemindersForAppointment(id);
  }

  return Response.json(appointment);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const existing = await prisma.appointment.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return notFound("Appointment not found");

  await prisma.appointment.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
