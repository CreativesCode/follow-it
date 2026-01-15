import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/tracking/[token]/events - Obtener eventos usando token público
// Esta es solo un wrapper de la Edge Function get_tracking_events
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: "Token es requerido" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { error: "Configuración faltante" },
        { status: 500 }
      );
    }

    // Llamar a Edge Function que maneja CORS y valida el token
    const response = await fetch(
      `${supabaseUrl}/functions/v1/get_tracking_events?token=${token}`,
      {
        headers: {
          Authorization: `Bearer ${anonKey}`,
        },
      }
    );

    const text = await response.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    if (!response.ok) {
      return NextResponse.json(
        typeof parsed === "object" &&
          parsed !== null &&
          "error" in parsed &&
          typeof parsed.error === "string"
          ? { error: parsed.error }
          : { error: "Error al obtener eventos" },
        { status: response.status }
      );
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("GET /api/tracking/[token]/events error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al obtener eventos";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
