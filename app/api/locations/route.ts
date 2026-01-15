import { createClient } from "@/lib/supabase/server";
import {
  locationBatchSchema,
  locationPingSchema,
} from "@/lib/validations/location";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/locations - Enviar ping de ubicación
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener courier del usuario
    const { data: courier, error: courierError } = await supabase
      .from("couriers")
      .select("id, business_id, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (courierError || !courier) {
      return NextResponse.json(
        { error: "No eres un mensajero activo" },
        { status: 403 }
      );
    }

    // Verificar que tiene pedidos activos
    const { count: activeOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("assigned_courier_id", courier.id)
      .in("status", ["assigned", "en_route"]);

    if (!activeOrders || activeOrders === 0) {
      return NextResponse.json(
        { error: "No tienes pedidos activos, tracking deshabilitado" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Soportar ping individual o batch
    let pings: Array<{
      lat: number;
      lng: number;
      accuracy_m?: number;
      speed_mps?: number;
      heading?: number;
      recorded_at?: string;
    }>;

    if (body.pings) {
      const batch = locationBatchSchema.parse(body);
      pings = batch.pings;
    } else {
      const ping = locationPingSchema.parse(body);
      pings = [ping];
    }

    // Insertar pings
    const inserts = pings.map((ping) => ({
      business_id: courier.business_id,
      courier_id: courier.id,
      lat: ping.lat,
      lng: ping.lng,
      accuracy_m: ping.accuracy_m ?? null,
      speed_mps: ping.speed_mps ?? null,
      heading: ping.heading ?? null,
      recorded_at: ping.recorded_at || new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("courier_locations")
      .insert(inserts);

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      count: pings.length,
    });
  } catch (error: unknown) {
    console.error("POST /api/locations error:", error);

    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError" &&
      "errors" in error
    ) {
      return NextResponse.json(
        {
          error: "Datos de ubicación inválidos",
          details: (error as { errors: unknown }).errors,
        },
        { status: 400 }
      );
    }

    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Error al guardar ubicación";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
