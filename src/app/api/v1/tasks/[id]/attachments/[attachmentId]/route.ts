import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized, notFound } from "@/lib/api-auth";
import { deleteFromStorage } from "@/lib/storage";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id: taskId, attachmentId } = await params;

  const attachment = await prisma.taskAttachment.findFirst({
    where: {
      id: attachmentId,
      taskId,
      task: { userId: user.id },
    },
  });

  if (!attachment) return notFound("Attachment not found");

  try {
    await deleteFromStorage(attachment.storagePath);
  } catch (err) {
    console.error("Storage delete error:", err);
  }

  await prisma.taskAttachment.delete({
    where: { id: attachmentId },
  });

  return new Response(null, { status: 204 });
}
