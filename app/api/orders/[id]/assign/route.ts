import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessRole } from "@/lib/utils/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const assignSchema = z.object({
  courier_id: z.string().uuid("ID de mensajero inválido"),
});

// POST /api/orders/[id]/assign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, businessMember } = await requireBusinessRole();
    const supabase = await createClient();
    const { id: orderId } = await params;

    // Validar body
    const body = await request.json();
    const { courier_id } = assignSchema.parse(body);

    // 1. Verificar que el pedido existe y está pending
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, business_id")
      .eq("id", orderId)
      .eq("business_id", businessMember.business_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: `No se puede asignar un pedido en estado "${order.status}"` },
        { status: 400 }
      );
    }

    // 2. Verificar que el courier existe y pertenece al negocio
    const { data: courier, error: courierError } = await supabase
      .from("couriers")
      .select("id, display_name, is_active")
      .eq("id", courier_id)
      .eq("business_id", businessMember.business_id)
      .single();

    if (courierError || !courier) {
      return NextResponse.json(
        { error: "Mensajero no encontrado" },
        { status: 404 }
      );
    }

    if (!courier.is_active) {
      return NextResponse.json(
        { error: "El mensajero no está activo" },
        { status: 400 }
      );
    }

    // 3. Actualizar pedido
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "assigned",
        assigned_courier_id: courier_id,
        assigned_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) throw updateError;

    // 4. Crear evento
    const { error: eventError } = await supabase.from("order_events").insert({
      business_id: businessMember.business_id,
      order_id: orderId,
      type: "order_assigned",
      from_status: "pending",
      to_status: "assigned",
      courier_id: courier_id,
      created_by: user.id,
      meta: { courier_name: courier.display_name },
    });

    if (eventError) {
      console.error("Error creating event:", eventError);
      // No fallar por esto, el pedido ya se actualizó
    }

    // 5. TODO: Enviar push notification al mensajero
    // await sendPushNotification(courier.user_id, {
    //   title: 'Nuevo pedido asignado',
    //   body: `Se te asignó el pedido ${order.code}`,
    // });

    return NextResponse.json({
      success: true,
      order_id: orderId,
      courier_id: courier_id,
      status: "assigned",
    });
  } catch (error: unknown) {
    console.error("POST /api/orders/[id]/assign error:", error);

    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return NextResponse.json(
        { error: "Datos inválidos", details: "errors" in error ? error.errors : [] },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Error al asignar pedido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/orders/[id]/assign - Desasignar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, businessMember } = await requireBusinessRole();
    const supabase = await createClient();
    const { id: orderId } = await params;

    // 1. Verificar pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, business_id, assigned_courier_id")
      .eq("id", orderId)
      .eq("business_id", businessMember.business_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (order.status !== "assigned") {
      return NextResponse.json(
        { error: `Solo se puede desasignar pedidos en estado "assigned"` },
        { status: 400 }
      );
    }

    const previousCourierId = order.assigned_courier_id;

    // 2. Actualizar pedido
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "pending",
        assigned_courier_id: null,
        assigned_at: null,
      })
      .eq("id", orderId);

    if (updateError) throw updateError;

    // 3. Crear evento
    await supabase.from("order_events").insert({
      business_id: businessMember.business_id,
      order_id: orderId,
      type: "order_unassigned",
      from_status: "assigned",
      to_status: "pending",
      courier_id: previousCourierId,
      created_by: user.id,
    });

    return NextResponse.json({
      success: true,
      order_id: orderId,
      status: "pending",
    });
  } catch (error: unknown) {
    console.error("DELETE /api/orders/[id]/assign error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al desasignar pedido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
