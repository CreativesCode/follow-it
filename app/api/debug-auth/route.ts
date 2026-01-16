import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Parse JWT sin verificar (solo para debug)
    let jwtPayload: unknown = null;
    if (session?.access_token) {
      try {
        const parts = session.access_token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64").toString("utf-8")
          );
          jwtPayload = {
            sub: payload.sub,
            aud: payload.aud,
            iss: payload.iss,
            exp: payload.exp,
            iat: payload.iat,
            email: payload.email,
          };
        }
      } catch {
        jwtPayload = { error: "No se pudo parsear JWT" };
      }
    }

    return NextResponse.json({
      auth: {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        authError: authError?.message,
      },
      session: {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        tokenLength: session?.access_token?.length,
        tokenPrefix: session?.access_token?.substring(0, 20) + "...",
        jwtPayload,
      },
      env: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        anonKeyPrefix:
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + "...",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
