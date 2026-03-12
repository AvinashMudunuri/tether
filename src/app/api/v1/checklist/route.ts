import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const appointmentId = searchParams.get("appointmentId");

  if (!appointmentId) {
    return badRequest("appointmentId query parameter is required");
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: user.id },
  });
  if (!appointment) {
    return Response.json(
      { error: "Appointment not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const items = await prisma.checklistItem.findMany({
    where: { appointmentId },
    orderBy: { order: "asc" },
  });

  return Response.json(items);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  let body: { appointmentId?: string; label?: string; order?: number };
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { appointmentId, label, order } = body;

  if (!appointmentId) return badRequest("appointmentId is required");
  if (!label?.trim()) return badRequest("label is required");

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: user.id },
  });
  if (!appointment) {
    return Response.json(
      { error: "Appointment not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const item = await prisma.checklistItem.create({
    data: {
      appointmentId,
      label: label.trim(),
      order: order ?? 0,
    },
  });

  return Response.json(item, { status: 201 });
}
