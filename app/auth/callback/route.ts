import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Successful authentication, redirect to the specified location
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
    
    console.error("Error exchanging code for session:", error);
  }

  // If there's an error or no code, redirect to login with error
  return NextResponse.redirect(
    new URL("/auth/login?error=Authentication failed", requestUrl.origin)
  );
}
