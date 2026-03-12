import { prisma } from "@/lib/db";

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getDashboardData(userId: string) {
  const todayStr = getTodayDateString();
  const todayStart = new Date(todayStr + "T00:00:00.000Z");
  const todayEnd = new Date(todayStr + "T23:59:59.999Z");
  const nextWeekEnd = new Date(todayStart);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
  nextWeekEnd.setHours(23, 59, 59, 999);

  const [todaysAppointments, upcomingAppointments, tasks] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        userId,
        date: { gte: todayStart, lte: todayEnd },
      },
      include: { checklistItems: true },
      orderBy: { time: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        userId,
        date: { gte: todayStart, lte: nextWeekEnd },
      },
      include: { checklistItems: true },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    }),
    prisma.task.findMany({
      where: { userId },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return { todaysAppointments, upcomingAppointments, tasks };
}
