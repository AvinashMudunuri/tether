import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return Response.json(tasks);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  let body: { title?: string; dueDate?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { title, dueDate, notes } = body;

  if (!title?.trim()) return badRequest("Title is required", { title: ["Required"] });

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      title: title.trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes?.trim() || null,
    },
  });

  return Response.json(task, { status: 201 });
}
