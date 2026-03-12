import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized, notFound } from "@/lib/api-auth";
import { getSignedUrl } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id: appointmentId, attachmentId } = await params;

  const attachment = await prisma.attachment.findFirst({
    where: {
      id: attachmentId,
      appointmentId,
      appointment: { userId: user.id },
    },
  });

  if (!attachment) return notFound("Attachment not found");

  const signedUrl = await getSignedUrl(attachment.storagePath);
  return Response.json({ url: signedUrl });
}
