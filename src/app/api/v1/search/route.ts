import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return Response.json({ tasks: [], appointments: [] });
  }

  const [tasks, appointments] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId: user.id,
        status: { not: "cancelled" },
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { notes: { not: null, contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    prisma.appointment.findMany({
      where: {
        userId: user.id,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { notes: { not: null, contains: q, mode: "insensitive" } },
          { location: { not: null, contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: 10,
    }),
  ]);

  return Response.json({
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      status: t.status,
      type: "task",
    })),
    appointments: appointments.map((a) => ({
      id: a.id,
      title: a.title,
      date: a.date,
      time: a.time,
      type: "appointment",
    })),
  });
}
