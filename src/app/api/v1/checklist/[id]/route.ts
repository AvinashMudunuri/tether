import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized, notFound, badRequest } from "@/lib/api-auth";

async function getItemWithAuth(id: string, userId: string) {
  const item = await prisma.checklistItem.findUnique({
    where: { id },
    include: { appointment: true },
  });
  if (!item || item.appointment.userId !== userId) return null;
  return item;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const existing = await getItemWithAuth(id, user.id);
  if (!existing) return notFound("Checklist item not found");

  let body: Partial<{ label: string; checked: boolean; order: number }>;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { label, checked, order } = body;

  const item = await prisma.checklistItem.update({
    where: { id },
    data: {
      ...(label !== undefined && { label: label.trim() }),
      ...(checked !== undefined && { checked }),
      ...(order !== undefined && { order }),
    },
  });

  return Response.json(item);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const existing = await getItemWithAuth(id, user.id);
  if (!existing) return notFound("Checklist item not found");

  await prisma.checklistItem.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
