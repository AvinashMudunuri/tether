import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized, notFound, badRequest } from "@/lib/api-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const existing = await prisma.task.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return notFound("Task not found");

  let body: Partial<{ title: string; dueDate: string; completed: boolean; notes: string }>;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { title, dueDate, completed, notes } = body;

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(completed !== undefined && { completed }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
    },
  });

  return Response.json(task);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const existing = await prisma.task.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return notFound("Task not found");

  await prisma.task.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
