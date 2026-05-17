import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/env";
import {
  authRatelimit,
  apiRatelimit,
  isRateLimitEnabled,
} from "@/lib/rate-limit";

async function checkRateLimit(request: NextRequest): Promise<NextResponse | null> {
  if (!isRateLimitEnabled()) return null;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const pathname = request.nextUrl.pathname;
  const isAuthPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password");
  const isApiPath =
    pathname.startsWith("/api/v1") &&
    !pathname.startsWith("/api/inngest") &&
    !pathname.startsWith("/api/cron") &&
    !pathname.startsWith("/api/health");

  if (isAuthPath && authRatelimit) {
    const { success } = await authRatelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }
  }

  if (isApiPath && apiRatelimit) {
    const { success } = await apiRatelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }
  }

  return null;
}

export async function updateSession(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    const isRefreshTokenError =
      err && typeof err === "object" && "code" in err && err.code === "refresh_token_not_found";
    if (isRefreshTokenError) {
      await supabase.auth.signOut();
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Session expired. Please sign in again." },
          { status: 401 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    throw err;
  }

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/forgot-password") ||
    request.nextUrl.pathname.startsWith("/auth");
  const isResetPasswordPage = request.nextUrl.pathname === "/auth/reset-password";
  const isDashboardRoute =
    request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname === "/";

  if (isAuthRoute && user && !isResetPasswordPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (isDashboardRoute && !user && request.nextUrl.pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname === "/" && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname === "/" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
