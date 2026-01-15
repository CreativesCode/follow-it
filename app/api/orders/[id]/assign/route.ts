import { createClient } from "@/lib/supabase/server";
import { requireBusinessRole } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
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
      .select("id, status, business_id, code, dropoff_address")
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
      .select("id, display_name, is_active, user_id, phone")
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

    // 5. Notificaciones
    try {
      const { createAdminClient } = await import("@/lib/supabase/server-admin");
      const admin = createAdminClient();
      const orderCode = order.code || `#${orderId.slice(0, 8)}`;

      // 5a. Notificación al mensajero (insertar directamente en BD)
      const { error: courierNotifError } = await admin
        .from("notifications")
        .insert({
          user_id: courier.user_id,
          title: "Nuevo pedido asignado",
          body: `Se te asignó el pedido ${orderCode}`,
          type: "order_assigned",
          data: {
            order_id: orderId,
            order_code: orderCode,
            dropoff_address: order.dropoff_address,
          },
        });

      if (courierNotifError) {
        console.error("Error inserting notification for courier:", {
          error: courierNotifError,
          courierUserId: courier.user_id,
          orderId: orderId,
        });
      } else {
        console.log(
          `Successfully created notification for courier ${courier.user_id}`
        );
      }

      // 5b. Notificaciones a miembros del negocio (insertar directamente en BD)
      const { data: businessMembers, error: membersError } = await admin
        .from("business_members")
        .select("user_id")
        .eq("business_id", businessMember.business_id)
        .eq("is_active", true);

      if (!membersError && businessMembers && businessMembers.length > 0) {
        const notifications = businessMembers.map((member) => ({
          user_id: member.user_id,
          title: "Pedido asignado",
          body: `El pedido ${orderCode} fue asignado a ${courier.display_name}`,
          type: "order_assigned",
          data: {
            order_id: orderId,
            order_code: orderCode,
            courier_id: courier_id,
            courier_name: courier.display_name,
          },
        }));

        const { error: insertError } = await admin
          .from("notifications")
          .insert(notifications);

        if (insertError) {
          console.error("Error inserting notifications for business members:", {
            error: insertError,
            orderId: orderId,
            notificationsCount: notifications.length,
            businessId: businessMember.business_id,
          });
        } else {
          console.log(
            `Successfully created ${notifications.length} notifications for business members`
          );
        }
      }

      // 5c. También enviar push notifications (si están configuradas)
      try {
        const { sendPushNotification } = await import(
          "@/lib/utils/notifications"
        );

        // Enviar push al mensajero
        await sendPushNotification({
          user_id: courier.user_id,
          title: "Nuevo pedido asignado",
          body: `Se te asignó el pedido ${orderCode}`,
          type: "order_assigned",
          data: {
            order_id: orderId,
            order_code: orderCode,
            dropoff_address: order.dropoff_address,
          },
        });

        // Enviar push a miembros del negocio en paralelo (no bloquea si falla)
        if (businessMembers && businessMembers.length > 0) {
          Promise.all(
            businessMembers.map((member) =>
              sendPushNotification({
                user_id: member.user_id,
                title: "Pedido asignado",
                body: `El pedido ${orderCode} fue asignado a ${courier.display_name}`,
                type: "order_assigned",
                data: {
                  order_id: orderId,
                  order_code: orderCode,
                  courier_id: courier_id,
                  courier_name: courier.display_name,
                },
              }).catch((err) => {
                console.error(
                  `Error sending push to business member ${member.user_id}:`,
                  err
                );
              })
            )
          ).catch((err) => {
            console.error("Error sending push notifications:", err);
          });
        }
      } catch (pushError) {
        console.error("Error sending push notifications:", pushError);
        // No fallar por esto, las notificaciones in-app ya se insertaron
      }
    } catch (notifError) {
      console.error("Error creating notifications:", notifError);
      // No fallar por esto
    }

    // 6. Notificación por WhatsApp al mensajero (opcional, no bloquea)
    try {
      // Obtener teléfono del mensajero (ya lo tenemos en courier.phone)
      const courierPhone = (courier as { phone: string | null }).phone;

      // Obtener detalles del pedido para el mensaje
      const { data: orderDetails } = await supabase
        .from("orders")
        .select("code, dropoff_address")
        .eq("id", orderId)
        .single();

      if (courierPhone && orderDetails) {
        // Obtener tracking link si existe
        const { data: trackingLink } = await supabase
          .from("order_tracking_links")
          .select("token")
          .eq("order_id", orderId)
          .eq("is_revoked", false)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const trackingUrl = trackingLink
          ? `${
              process.env.NEXT_PUBLIC_APP_URL || ""
            }/track?token=${encodeURIComponent(trackingLink.token)}`
          : undefined;

        const { formatAssignmentMessage } = await import(
          "@/lib/utils/whatsapp"
        );
        const message = formatAssignmentMessage(
          orderDetails.code || `#${orderId.slice(0, 8)}`,
          orderDetails.dropoff_address,
          trackingUrl
        );

        // Enviar por WhatsApp (no bloquea si falla)
        const internalSecret = process.env.INTERNAL_API_SECRET;
        if (internalSecret) {
          const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send_whatsapp_notification`;
          fetch(fnUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-secret": internalSecret,
            },
            body: JSON.stringify({
              phone_number: courierPhone,
              message,
              order_code: orderDetails.code,
              tracking_url: trackingUrl,
            }),
          }).catch((err) => {
            console.error("Error sending WhatsApp notification:", err);
          });
        }
      }
    } catch (whatsappError) {
      console.error("Error preparing WhatsApp notification:", whatsappError);
      // No fallar por esto
    }

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
        {
          error: "Datos inválidos",
          details: "errors" in error ? error.errors : [],
        },
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
  _request: NextRequest,
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
