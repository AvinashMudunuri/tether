import { prisma } from "@/lib/db";
import { expandRecurringAppointments } from "@/lib/recurrence";

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

  const [rawAppointments, missedAppointments, tasks] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        userId,
        status: "scheduled",
        OR: [
          {
            recurrenceType: null,
            date: { gte: todayStart, lte: nextWeekEnd },
          },
          {
            recurrenceType: { not: null },
            date: { lte: nextWeekEnd },
            OR: [
              { recurrenceEndDate: null },
              { recurrenceEndDate: { gte: todayStart } },
            ],
          },
        ],
      },
      include: { checklistItems: true },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    }),
    prisma.appointment.findMany({
      where: { userId, status: "missed" },
      include: { checklistItems: true },
      orderBy: [{ date: "desc" }, { time: "desc" }],
      take: 10,
    }),
    prisma.task.findMany({
      where: { userId, status: { not: "cancelled" } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const expanded = expandRecurringAppointments(
    rawAppointments.map((a) => ({
      ...a,
      date: a.date,
      recurrenceType: a.recurrenceType,
      recurrenceEndDate: a.recurrenceEndDate,
    })),
    todayStart,
    nextWeekEnd
  );

  const todaysAppointments = expanded
    .filter((a) => a.date === todayStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const upcomingAppointments = expanded
    .filter((a) => a.date >= todayStr)
    .slice(0, 10);

  const overdueTasks = tasks.filter(
    (t) =>
      t.status !== "completed" &&
      t.status !== "cancelled" &&
      t.dueDate &&
      t.dueDate < todayStart
  );

  const todaysTasks = tasks.filter(
    (t) =>
      t.dueDate &&
      t.dueDate >= todayStart &&
      t.dueDate <= todayEnd &&
      t.status !== "cancelled"
  );

  const completedTodayCount = tasks.filter(
    (t) =>
      t.status === "completed" &&
      t.updatedAt >= todayStart &&
      t.updatedAt <= todayEnd
  ).length;

  return {
    todaysAppointments,
    upcomingAppointments,
    missedAppointments,
    tasks,
    overdueTasks,
    todaysTasks,
    completedTodayCount,
  };
}
