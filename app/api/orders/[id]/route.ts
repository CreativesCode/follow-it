import { createClient } from "@/lib/supabase/server";
import {
  getUserRole,
  requireAuth,
  requireBusinessRole,
} from "@/lib/utils/auth";
import { updateOrderSchema } from "@/lib/validations/order";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/orders/[id] - Obtener pedido individual (business members y couriers asignados)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const role = await getUserRole(user.id);
    const supabase = await createClient();
    const { id: orderIdParam } = await params;

    // Decodificar el parámetro de la URL
    const orderId = decodeURIComponent(orderIdParam);

    if (!orderId) {
      return NextResponse.json(
        { error: "Falta el id del pedido" },
        { status: 400 }
      );
    }

    if (!role.type) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Query base - RLS manejará los permisos
    let query = supabase.from("orders").select(
      `
        *,
        courier:couriers!assigned_courier_id(id, display_name, phone),
        customer:customers(id, name, phone)
      `
    );

    // Buscar por ID (UUID) o por código
    // Si el orderId parece ser un UUID, buscar por id
    // Si no, buscar por code (removiendo el # si existe)
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        orderId
      );

    if (isUUID) {
      console.log("[API /orders/[id]] Buscando por UUID:", orderId);
      query = query.eq("id", orderId);
    } else {
      // Asegurar que el código tenga el # al inicio (como se guarda en la BD)
      // Si el usuario ingresó sin #, agregarlo; si ya lo tiene, dejarlo
      const codeToSearch = orderId.startsWith("#") ? orderId : `#${orderId}`;
      console.log("[API /orders/[id]] Buscando por código:", codeToSearch);
      query = query.eq("code", codeToSearch);
    }

    // Si es business member, filtrar por business_id
    if (role.type === "business") {
      const businessMember = role.data as { business_id: string };
      query = query.eq("business_id", businessMember.business_id);
    }
    // Si es courier, RLS automáticamente filtra por assigned_courier_id

    const { data: order, error } = await query.single();

    console.log("[API /orders/[id]] Resultado de la búsqueda:", {
      order: order?.id || order?.code,
      error,
    });

    if (error || !order) {
      console.log("[API /orders/[id]] Pedido no encontrado, error:", error);
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    console.log("[API /orders/[id]] Pedido encontrado, retornando:", order.id);
    return NextResponse.json({ order });
  } catch (error: unknown) {
    console.error("GET /api/orders/[id] error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al obtener pedido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PATCH /api/orders/[id] - Actualizar pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { businessMember } = await requireBusinessRole();
    const supabase = await createClient();
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Falta el id del pedido" },
        { status: 400 }
      );
    }

    // Verificar que el pedido existe y pertenece al negocio
    const { data: existingOrder, error: checkError } = await supabase
      .from("orders")
      .select("id, business_id, status, customer_id")
      .eq("id", orderId)
      .eq("business_id", businessMember.business_id)
      .single();

    if (checkError || !existingOrder) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Solo permitir editar pedidos que no estén entregados o cancelados
    if (["delivered", "canceled"].includes(existingOrder.status)) {
      return NextResponse.json(
        { error: "No se puede editar un pedido entregado o cancelado" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = updateOrderSchema.parse(body);

    // Actualizar cliente si se proporcionó info
    const existingCustomerId = (existingOrder as { customer_id: string | null })
      .customer_id;
    let customer_id = existingCustomerId || null;
    if (data.customer_name || data.customer_phone) {
      // Buscar cliente existente o crear uno nuevo
      if (existingCustomerId) {
        // Actualizar cliente existente
        const { error: customerError } = await supabase
          .from("customers")
          .update({
            name: data.customer_name || null,
            phone: data.customer_phone || null,
          })
          .eq("id", existingCustomerId);

        if (customerError) {
          console.error("Error updating customer:", customerError);
        }
      } else {
        // Crear nuevo cliente
        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .insert({
            business_id: businessMember.business_id,
            name: data.customer_name,
            phone: data.customer_phone,
          })
          .select("id")
          .single();

        if (!customerError && customer) {
          customer_id = customer.id;
        }
      }
    }

    // Actualizar pedido
    const { data: order, error } = await supabase
      .from("orders")
      .update({
        dropoff_address: data.dropoff_address,
        pickup_address: data.pickup_address,
        dropoff_lat: data.dropoff_lat,
        dropoff_lng: data.dropoff_lng,
        items_summary: data.items_summary,
        notes: data.notes,
        amount_cents: data.amount_cents,
        customer_id,
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ order });
  } catch (error: unknown) {
    console.error("PATCH /api/orders/[id] error:", error);

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
      error instanceof Error ? error.message : "Error al actualizar pedido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
