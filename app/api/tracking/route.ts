import { createClient } from "@/lib/supabase/server";
import { requireBusinessRole } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/tracking - Crear link de tracking
export async function POST(request: NextRequest) {
  try {
    const { businessMember } = await requireBusinessRole();
    const supabase = await createClient();

    const body = await request.json();
    const { order_id, expires_in_hours = 24 } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: "order_id es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el pedido existe y es del negocio
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, code, business_id")
      .eq("id", order_id)
      .eq("business_id", businessMember.business_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Obtener usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Usar el mismo patrón que change_order_status: internal secret
    const internalSecret = process.env.INTERNAL_API_SECRET;
    if (!internalSecret) {
      console.error("[DEBUG] Falta INTERNAL_API_SECRET");
      return NextResponse.json(
        { error: "Configuración de servidor incompleta" },
        { status: 500 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json(
        { error: "Configuración faltante" },
        { status: 500 }
      );
    }

    const fnUrl = `${supabaseUrl}/functions/v1/create_tracking_link`;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const fnRes = await fetch(fnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
        "x-internal-secret": internalSecret,
      },
      body: JSON.stringify({
        order_id,
        expires_in_minutes: expires_in_hours * 60,
        _user_id: user.id, // La función usa esto para validar permisos
      }),
      cache: "no-store",
    });

    const text = await fnRes.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    if (!fnRes.ok) {
      console.error("[DEBUG] Edge Function error:", {
        status: fnRes.status,
        statusText: fnRes.statusText,
        body: parsed,
      });
      return NextResponse.json(
        typeof parsed === "object" &&
          parsed !== null &&
          "error" in parsed &&
          typeof parsed.error === "string"
          ? { error: parsed.error }
          : { error: "Error al crear link de tracking", details: parsed },
        { status: fnRes.status }
      );
    }

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("token" in parsed) ||
      typeof parsed.token !== "string"
    ) {
      return NextResponse.json(
        { error: "Respuesta inválida de la Edge Function" },
        { status: 500 }
      );
    }

    // Construir URL completa
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const trackingUrl = `${baseUrl}/track?token=${encodeURIComponent(
      parsed.token
    )}`;

    return NextResponse.json({
      tracking_url: trackingUrl,
      token: parsed.token,
      expires_at:
        "expires_at" in parsed && typeof parsed.expires_at === "string"
          ? parsed.expires_at
          : undefined,
      order_code: order.code,
    });
  } catch (error: unknown) {
    console.error("POST /api/tracking error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error al crear link de tracking";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
