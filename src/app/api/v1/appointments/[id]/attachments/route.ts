import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized, notFound, badRequest } from "@/lib/api-auth";
import { validateFile, uploadAttachment } from "@/lib/storage";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id: appointmentId } = await params;

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: user.id },
  });
  if (!appointment) return notFound("Appointment not found");

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return badRequest("No file provided");
  }

  const validationError = validateFile(file);
  if (validationError) {
    return badRequest(validationError);
  }

  try {
    const { storagePath } = await uploadAttachment(
      user.id,
      appointmentId,
      file
    );

    const attachment = await prisma.attachment.create({
      data: {
        appointmentId,
        fileName: file.name,
        storagePath,
        mimeType: file.type,
        size: file.size,
      },
    });

    return Response.json(attachment, { status: 201 });
  } catch (err) {
    console.error("Attachment upload error:", err);
    return badRequest(
      err instanceof Error ? err.message : "Failed to upload file"
    );
  }
}
