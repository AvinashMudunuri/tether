import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "appointment-attachments";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Magic byte signatures for server-side content validation (client MIME can be spoofed)
const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }> = {
  "image/jpeg": { offset: 0, bytes: [0xff, 0xd8, 0xff] },
  "image/png": { offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  "image/webp": { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF; WEBP at bytes 8-11
};

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return "Only JPG, PNG, and WebP images are allowed";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "File size must be under 5MB";
  }
  return null;
}

/** Validates file content matches declared MIME via magic bytes. Call after validateFile. */
export function validateFileMagicBytes(buffer: Buffer, declaredMime: string): boolean {
  const spec = MAGIC_BYTES[declaredMime];
  if (!spec) return false;
  const { offset, bytes } = spec;
  if (buffer.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[offset + i] !== bytes[i]) return false;
  }
  // WebP: also check "WEBP" at bytes 8-11
  if (declaredMime === "image/webp" && buffer.length >= 12) {
    const webp = [0x57, 0x45, 0x42, 0x50]; // WEBP
    for (let i = 0; i < 4; i++) {
      if (buffer[8 + i] !== webp[i]) return false;
    }
  }
  return true;
}

/** Derive safe extension from validated MIME only (never trust filename). */
function getSafeExtension(mimeType: string): string {
  return EXT_BY_MIME[mimeType] ?? "jpg";
}

/** Sanitize filename for display/storage: basename only, safe chars, max length. */
export function sanitizeFileName(name: string): string {
  const basename = name.split(/[/\\]/).pop() || "image";
  const safe = basename.replaceAll(/[^\w\u00C0-\uFFFF.-]/g, "_");
  return safe.slice(0, 255) || "image";
}

function buildStoragePath(
  userId: string,
  entityType: "appointments" | "tasks",
  entityId: string,
  mimeType: string
): string {
  const ext = getSafeExtension(mimeType);
  const uniqueId = crypto.randomUUID();
  return `${entityType}/${userId}/${entityId}/${uniqueId}.${ext}`;
}

export async function uploadAttachment(
  userId: string,
  appointmentId: string,
  file: File
): Promise<{ storagePath: string; sanitizedFileName: string }> {
  const storagePath = buildStoragePath(userId, "appointments", appointmentId, file.type);
  const result = await uploadToStorage(file, storagePath);
  return { ...result, sanitizedFileName: sanitizeFileName(file.name) };
}

export async function uploadTaskAttachment(
  userId: string,
  taskId: string,
  file: File
): Promise<{ storagePath: string; sanitizedFileName: string }> {
  const storagePath = buildStoragePath(userId, "tasks", taskId, file.type);
  const result = await uploadToStorage(file, storagePath);
  return { ...result, sanitizedFileName: sanitizeFileName(file.name) };
}

async function uploadToStorage(
  file: File,
  storagePath: string
): Promise<{ storagePath: string }> {
  const supabase = createAdminClient();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!validateFileMagicBytes(buffer, file.type)) {
    throw new Error("File content does not match the declared image type");
  }

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
