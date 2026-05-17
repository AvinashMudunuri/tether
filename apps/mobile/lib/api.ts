import { getApiBaseUrl } from "@/lib/env";
import { getSupabaseClient } from "@/lib/supabase";

/**
 * Calls the Next.js `/api/v1` routes with the current Supabase access token.
 */
export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const base = getApiBaseUrl();
  const {
    data: { session },
  } = await getSupabaseClient().auth.getSession();
  const token = session?.access_token;
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return fetch(`${base}${normalized}`, {
    ...init,
    headers,
  });
}
