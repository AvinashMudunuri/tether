import { headers } from "next/headers";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/env";
import { NextResponse } from "next/server";

/**
 * Resolves the current user for API routes.
 * - If `Authorization: Bearer <access_token>` is present, validates that JWT only (no cookie fallback).
 * - Otherwise uses the cookie-based Supabase session (web).
 */
export async function getAuthUser() {
  const headerList = headers();
  const authHeader = headerList.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token.length === 0) {
      return null;
    }
    const supabase = createSupabaseJsClient(
      getSupabaseUrl(),
      getSupabaseAnonKey()
    );
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return user;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized", code: "UNAUTHORIZED" },
    { status: 401 }
  );
}

export function notFound(message = "Not found") {
  return NextResponse.json(
    { error: message, code: "NOT_FOUND" },
    { status: 404 }
  );
}

export function badRequest(message: string, errors?: Record<string, string[]>) {
  return NextResponse.json(
    { error: message, code: "BAD_REQUEST", errors },
    { status: 400 }
  );
}
