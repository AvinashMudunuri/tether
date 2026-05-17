/**
 * Centralized env validation. Throws with clear errors if required vars are missing.
 * Use these getters instead of process.env in critical paths.
 *
 * IMPORTANT: Uses direct process.env.X access (not process.env[key]) so Next.js
 * can inline NEXT_PUBLIC_* vars at build time for client-side code. Dynamic keys
 * would not get inlined and would see an empty object in the browser.
 */

export function getSupabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value || value === "") {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env and restart the dev server."
    );
  }
  return value;
}

export function getSupabaseAnonKey(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value || value === "") {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Add it to .env and restart the dev server."
    );
  }
  return value;
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.tetherly.site"
  );
}
