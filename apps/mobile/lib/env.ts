/**
 * Expo public env (set in apps/mobile/.env as EXPO_PUBLIC_*).
 */
export function getSupabaseUrl(): string {
  const value = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!value || value === "") {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_URL. Copy apps/mobile/.env.example to apps/mobile/.env."
    );
  }
  return value;
}

export function getSupabaseAnonKey(): string {
  const value = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!value || value === "") {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy apps/mobile/.env.example to apps/mobile/.env."
    );
  }
  return value;
}

export function getApiBaseUrl(): string {
  const value = process.env.EXPO_PUBLIC_API_URL;
  if (!value || value === "") {
    throw new Error(
      "Missing EXPO_PUBLIC_API_URL (Next app origin, e.g. http://192.168.1.10:3000). Copy apps/mobile/.env.example to apps/mobile/.env."
    );
  }
  return value.replace(/\/$/, "");
}
