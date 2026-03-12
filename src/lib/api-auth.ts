import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function getAuthUser() {
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
