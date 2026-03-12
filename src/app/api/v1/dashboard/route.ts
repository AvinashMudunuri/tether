import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/api-auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayStart = new Date(todayStr + "T00:00:00.000Z");
  const todayEnd = new Date(todayStr + "T23:59:59.999Z");
  const nextWeekEnd = new Date(todayStart);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
  nextWeekEnd.setHours(23, 59, 59, 999);

  const [todaysAppointments, upcomingAppointments, tasks] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        userId: user.id,
        date: { gte: todayStart, lte: todayEnd },
      },
      include: { checklistItems: true },
      orderBy: { time: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        userId: user.id,
        date: { gte: todayStart, lte: nextWeekEnd },
      },
      include: { checklistItems: true },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    }),
    prisma.task.findMany({
      where: { userId: user.id },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return Response.json({
    todaysAppointments,
    upcomingAppointments,
    tasks,
  });
}
