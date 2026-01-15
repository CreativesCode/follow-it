import { createClient } from "@/lib/supabase/server";
import { changeStatusSchema } from "@/lib/validations/order";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/orders/[id]/status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener un access_token fresco para reenviarlo a Edge Functions.
    // Nota: el middleware puede refrescar tokens en la respuesta, pero aquí
    // seguimos viendo las cookies originales del request.
    const {
      data: { session: session1 },
    } = await supabase.auth.getSession();

    console.log("[DEBUG] getSession result:", {
      hasSession: !!session1,
      hasAccessToken: !!session1?.access_token,
      tokenLength: session1?.access_token?.length,
      userId: session1?.user?.id,
    });

    let session = session1;
    if (!session?.access_token) {
      console.log("[DEBUG] No access_token, intentando refresh...");
      const { data: refreshed, error: refreshError } =
        await supabase.auth.refreshSession();
      if (!refreshError && refreshed.session?.access_token) {
        console.log("[DEBUG] Refresh exitoso:", {
          hasAccessToken: !!refreshed.session.access_token,
          tokenLength: refreshed.session.access_token.length,
        });
        session = refreshed.session;
      } else {
        console.error("[DEBUG] Refresh falló:", refreshError?.message);
      }
    }

    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Falta el id del pedido" },
        { status: 400 }
      );
    }
    const body = await request.json();
    const data = changeStatusSchema.parse({
      order_id: orderId,
      ...body,
    });

    // Solución: usar un secret compartido para invocar la función.
    // El Route Handler ya validó al usuario, la Edge Function confía en esto.
    // IMPORTANTE: Solo hacemos esto desde Route Handlers server-side, NUNCA del cliente.
    const internalSecret = process.env.INTERNAL_API_SECRET;
    if (!internalSecret) {
      console.error("[DEBUG] Falta INTERNAL_API_SECRET");
      return NextResponse.json(
        { error: "Configuración de servidor incompleta" },
        { status: 500 }
      );
    }

    const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/change_order_status`;

    console.log("[DEBUG] Invocando Edge Function con internal secret:", {
      userId: user.id,
      userEmail: user.email,
      orderId: data.order_id,
      toStatus: data.to_status,
    });

    // Invocar con x-internal-secret header
    // También enviamos Authorization con anon key para que Supabase permita la petición
    // La seguridad real la da el x-internal-secret
    // Pasamos _user_id para que la función sepa qué usuario está haciendo el cambio
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const fnRes = await fetch(fnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
        "x-internal-secret": internalSecret,
      },
      body: JSON.stringify({
        ...data,
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
        typeof parsed === "object" && parsed !== null
          ? parsed
          : { error: "Edge Function error", details: parsed },
        { status: fnRes.status }
      );
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("POST /api/orders/[id]/status error:", error);

    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: "errors" in error ? error.errors : [],
        },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Error al cambiar estado";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
