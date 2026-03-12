import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "appointment-attachments";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPG, PNG, and WebP images are allowed";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "File size must be under 5MB";
  }
  return null;
}

function buildStoragePath(
  userId: string,
  entityType: "appointments" | "tasks",
  entityId: string,
  file: File
): string {
  const ext = file.name.split(".").pop() || "jpg";
  const uniqueId = crypto.randomUUID();
  return `${entityType}/${userId}/${entityId}/${uniqueId}.${ext}`;
}

export async function uploadAttachment(
  userId: string,
  appointmentId: string,
  file: File
): Promise<{ storagePath: string }> {
  const storagePath = buildStoragePath(userId, "appointments", appointmentId, file);
  return uploadToStorage(file, storagePath);
}

export async function uploadTaskAttachment(
  userId: string,
  taskId: string,
  file: File
): Promise<{ storagePath: string }> {
  const storagePath = buildStoragePath(userId, "tasks", taskId, file);
  return uploadToStorage(file, storagePath);
}

async function uploadToStorage(
  file: File,
  storagePath: string
): Promise<{ storagePath: string }> {

  const supabase = createAdminClient();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    if (error.message?.includes("Bucket not found")) {
      const { error: createError } = await supabase.storage.createBucket(
        BUCKET,
        { public: false }
      );
      if (createError) {
        throw new Error(`Storage error: ${createError.message}`);
      }
      const { error: retryError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });
      if (retryError) throw new Error(`Upload failed: ${retryError.message}`);
    } else {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  return { storagePath };
}

export async function deleteFromStorage(storagePath: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

export async function getSignedUrl(
  storagePath: string,
  expiresIn = 3600
): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn);
  if (error) throw new Error(`Failed to get URL: ${error.message}`);
  return data.signedUrl;
}
