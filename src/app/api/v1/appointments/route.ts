import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const where: { userId: string; date?: { gte?: Date; lte?: Date } } = {
    userId: user.id,
  };

  if (start && end) {
    where.date = {
      gte: new Date(start),
      lte: new Date(end),
    };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { checklistItems: true, reminders: true },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return Response.json(appointments);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  let body: { title?: string; date?: string; time?: string; location?: string; attendees?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { title, date, time, location, attendees, notes } = body;

  if (!title?.trim()) return badRequest("Title is required", { title: ["Required"] });
  if (!date) return badRequest("Date is required", { date: ["Required"] });
  if (!time) return badRequest("Time is required", { time: ["Required"] });

  const appointmentDate = new Date(date);
  const appointment = await prisma.appointment.create({
    data: {
      userId: user.id,
      title: title.trim(),
      date: appointmentDate,
      time: time.trim(),
      location: location?.trim() || null,
      attendees: attendees?.trim() || null,
      notes: notes?.trim() || null,
      reminders: {
        create: [
          { minutesBefore: 1440 },
          { minutesBefore: 60 },
        ],
      },
    },
    include: { checklistItems: true, reminders: true },
  });

  return Response.json(appointment, { status: 201 });
}
