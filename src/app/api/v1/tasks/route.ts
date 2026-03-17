import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-auth";

function formatTime24to12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const hour = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const where: { userId: string; dueDate?: { gte?: Date; lte?: Date } } = {
    userId: user.id,
  };

  if (start && end) {
    where.dueDate = {
      gte: new Date(start),
      lte: new Date(end),
    };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: { attachments: true },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return Response.json(tasks);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  let body: { title?: string; dueDate?: string; dueTime?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { title, dueDate, dueTime, notes } = body;

  if (!title?.trim()) return badRequest("Title is required", { title: ["Required"] });

  let notesWithTime: string | null = notes?.trim() || null;
  if (dueTime && /^\d{1,2}:\d{2}$/.test(dueTime)) {
    const timeStr = `Due at ${formatTime24to12(dueTime)}`;
    notesWithTime = notesWithTime ? `${notesWithTime}\n${timeStr}` : timeStr;
  }

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      title: title.trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notesWithTime,
    },
  });

  return Response.json(task, { status: 201 });
}
