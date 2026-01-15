import { createClient } from "@/lib/supabase/server";
import {
  getUserRole,
  requireAuth,
  requireBusinessRole,
} from "@/lib/utils/auth";
import { createOrderSchema, orderFiltersSchema } from "@/lib/validations/order";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// API routes must be dynamic
export const dynamic = "force-dynamic";

// Helper: Generar código único de pedido
async function generateOrderCode(
  supabase: SupabaseClient,
  businessId: string
): Promise<string> {
  const today = new Date();
  const prefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(today.getDate()).padStart(2, "0")}`;

  // Contar pedidos de hoy
  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("created_at", today.toISOString().split("T")[0]);

  const sequence = String((count || 0) + 1).padStart(4, "0");
  return `#${prefix}-${sequence}`;
}

// GET /api/orders - Listar pedidos (business members ven todos, couriers solo asignados)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const role = await getUserRole(user.id);
    const supabase = await createClient();

    if (!role.type) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const filters = orderFiltersSchema.parse({
      status: searchParams.get("status") || undefined,
      courier_id: searchParams.get("courier_id") || undefined,
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 20,
    });

    // Query base - RLS manejará los permisos
    let query = supabase.from("orders").select(
      `
        *,
        courier:couriers!assigned_courier_id(id, display_name, phone),
        customer:customers(id, name, phone)
      `,
      { count: "exact" }
    );

    // Si es business member, filtrar por business_id
    if (role.type === "business") {
      const businessMember = role.data as { business_id: string };
      query = query.eq("business_id", businessMember.business_id);
    }
    // Si es courier, RLS automáticamente filtra por assigned_courier_id

    query = query.order("updated_at", { ascending: false });

    // Aplicar filtros
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.courier_id && filters.courier_id !== "all") {
      query = query.eq("assigned_courier_id", filters.courier_id);
    }
    if (filters.date_from) {
      query = query.gte("created_at", filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte("created_at", filters.date_to);
    }
    if (filters.search) {
      query = query.or(
        `code.ilike.%${filters.search}%,dropoff_address.ilike.%${filters.search}%`
      );
    }

    // Paginación
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      orders: data || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / filters.limit),
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/orders error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al obtener pedidos";
    const errorStatus =
      error && typeof error === "object" && "status" in error
        ? (error.status as number)
        : 500;
    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}

// POST /api/orders - Crear pedido
export async function POST(request: NextRequest) {
  try {
    const { user, businessMember } = await requireBusinessRole();
    const supabase = await createClient();

    const body = await request.json();
    const data = createOrderSchema.parse(body);

    // Generar código único
    const code = await generateOrderCode(supabase, businessMember.business_id);

    // Crear cliente si se proporcionó info
    let customer_id = null;
    if (data.customer_name || data.customer_phone) {
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

    // Crear pedido
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        business_id: businessMember.business_id,
        code,
        customer_id,
        dropoff_address: data.dropoff_address,
        pickup_address: data.pickup_address,
        dropoff_lat: data.dropoff_lat,
        dropoff_lng: data.dropoff_lng,
        items_summary: data.items_summary,
        notes: data.notes,
        amount_cents: data.amount_cents,
        status: "pending",
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Crear evento inicial
    await supabase.from("order_events").insert({
      business_id: businessMember.business_id,
      order_id: order.id,
      type: "order_created",
      to_status: "pending",
      created_by: user.id,
    });

    // Crear notificaciones para todos los miembros activos del negocio
    try {
      const { createAdminClient } = await import("@/lib/supabase/server-admin");
      const admin = createAdminClient();

      // Obtener todos los miembros activos del negocio
      const { data: businessMembers, error: membersError } = await admin
        .from("business_members")
        .select("user_id")
        .eq("business_id", businessMember.business_id)
        .eq("is_active", true);

      if (membersError) {
        console.error(
          "Error fetching business members for notifications:",
          membersError
        );
      } else if (!businessMembers || businessMembers.length === 0) {
        console.log(
          `No active business members found for business ${businessMember.business_id}`
        );
      } else {
        const orderCode = order.code || `#${order.id.slice(0, 8)}`;

        // Crear notificaciones para todos los miembros del negocio
        const notifications = businessMembers.map((member) => ({
          user_id: member.user_id,
          title: "Nuevo pedido creado",
          body: `Se creó el pedido ${orderCode}`,
          type: "order_created",
          data: {
            order_id: order.id,
            order_code: orderCode,
            status: "pending",
          },
        }));

        console.log(
          `Attempting to insert ${notifications.length} notifications for order ${order.id}`
        );

        // Insertar notificaciones directamente en la base de datos
        const { data: insertedNotifications, error: insertError } = await admin
          .from("notifications")
          .insert(notifications)
          .select();

        if (insertError) {
          console.error("Error inserting notifications for new order:", {
            error: insertError,
            orderId: order.id,
            notificationsCount: notifications.length,
            businessId: businessMember.business_id,
          });
        } else {
          console.log(
            `Successfully created ${
              insertedNotifications?.length || 0
            } notifications for new order ${order.id}`
          );
        }
      }
    } catch (notifError) {
      console.error("Error creating notifications for new order:", {
        error: notifError,
        orderId: order.id,
        businessId: businessMember.business_id,
      });
      // No fallar por esto
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/orders error:", error);

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
      error instanceof Error ? error.message : "Error al crear pedido";
    const errorStatus =
      error && typeof error === "object" && "status" in error
        ? (error.status as number)
        : 500;
    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}
