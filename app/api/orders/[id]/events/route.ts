import { createClient } from "@/lib/supabase/server";
import { getUserRole, requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/orders/[id]/events - Obtener eventos del pedido (timeline)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const role = await getUserRole(user.id);
    const supabase = await createClient();
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Falta el id del pedido" },
        { status: 400 }
      );
    }

    if (!role.type) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Primero verificar que el pedido existe y el usuario tiene acceso
    let orderQuery = supabase.from("orders").select("id, business_id").eq("id", orderId);

    if (role.type === "business") {
      const businessMember = role.data as { business_id: string };
      orderQuery = orderQuery.eq("business_id", businessMember.business_id);
    } else if (role.type === "courier") {
      const courier = role.data as { id: string };
      orderQuery = orderQuery.eq("assigned_courier_id", courier.id);
    }

    const { data: order, error: orderError } = await orderQuery.single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Obtener eventos del pedido con información del courier si aplica
    const { data: events, error: eventsError } = await supabase
      .from("order_events")
      .select(
        `
        *,
        courier:couriers!courier_id(id, display_name)
      `
      )
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      return NextResponse.json(
        { error: "Error al obtener eventos" },
        { status: 500 }
      );
    }

    return NextResponse.json({ events: events || [] });
  } catch (error: unknown) {
    console.error("GET /api/orders/[id]/events error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al obtener eventos";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
