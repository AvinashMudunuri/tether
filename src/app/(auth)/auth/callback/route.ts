import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Auth callback for PKCE code exchange.
 * Supabase redirects here with ?code= after password reset / OAuth.
 * Exchange must happen server-side so the code_verifier (stored in cookies)
 * is available - client-side exchange fails with "PKCE code verifier not found".
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/auth/reset-password";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/reset-password?error=auth`);
}
