// supabase/functions/change_order_status/index.ts
import {
  badRequest,
  forbidden,
  json,
  ok,
  unauthorized,
} from "../_shared/http.ts";
import { supabaseAdmin, supabaseUser } from "../_shared/supabase.ts";

type OrderStatus =
  | "pending"
  | "assigned"
  | "en_route"
  | "delivered"
  | "failed"
  | "canceled";

type Payload = {
  order_id: string;
  to_status: OrderStatus;
  note?: string | null;
  proof_id?: string | null;
  // Cuando se invoca desde Route Handler con service_role:
  _user_id?: string;
};

function isValidStatus(s: string): s is OrderStatus {
  return [
    "pending",
    "assigned",
    "en_route",
    "delivered",
    "failed",
    "canceled",
  ].includes(s);
}

function allowedTransition(from: OrderStatus, to: OrderStatus): boolean {
  // MVP transitions
  if (from === to) return false;

  if (to === "canceled") return true; // panel can cancel from any state (you can restrict later)

  if (from === "pending" && to === "assigned") return true;
  if (from === "assigned" && (to === "en_route" || to === "pending"))
    return true; // pending means "unassigned"
  if (from === "en_route" && (to === "delivered" || to === "failed"))
    return true;

  return false;
}

function isCourierOnlyStatus(to: OrderStatus): boolean {
  return ["en_route", "delivered", "failed"].includes(to);
}

function isPanelOnlyTransition(from: OrderStatus, to: OrderStatus): boolean {
  // "unassign": assigned -> pending (panel)
  if (from === "assigned" && to === "pending") return true;
  // pending -> assigned (panel)
  if (from === "pending" && to === "assigned") return true;
  // cancel (panel) could be restricted here if desired
  return false;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  // Parse payload first
  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  // Determinar el flujo de autenticación:
  // 1. Si viene _user_id en el body y x-internal-secret coincide -> flujo desde Route Handler
  // 2. Si viene Authorization con JWT de usuario -> flujo directo (original)
  const authHeader = req.headers.get("Authorization") || "";
  const internalSecret = req.headers.get("x-internal-secret") || "";

  // Secret compartido entre Next.js y Edge Functions
  // Configurar en Supabase: supabase secrets set INTERNAL_API_SECRET=<tu-secret>
  // Y en .env.local de Next.js: INTERNAL_API_SECRET=<tu-secret>
  const expectedSecret = Deno.env.get("INTERNAL_API_SECRET") || "";

  // Verificar si es una llamada interna desde el Route Handler
  const isInternalCall =
    internalSecret.length > 0 &&
    expectedSecret.length > 0 &&
    internalSecret === expectedSecret;

  console.log("[DEBUG] Auth check:", {
    hasAuthHeader: !!authHeader,
    hasInternalSecret: internalSecret.length > 0,
    hasExpectedSecret: expectedSecret.length > 0,
    secretsMatch: isInternalCall,
    hasUserId: !!payload._user_id,
    userId: payload._user_id,
  });

  let userId: string;

  if (isInternalCall && payload._user_id) {
    // Flujo desde Route Handler: ya validó al usuario con x-internal-secret
    console.log("[DEBUG] Usando flujo interno con _user_id");
    userId = payload._user_id;
  } else {
    // Flujo original: validar JWT del usuario
    console.log("[DEBUG] Usando flujo JWT de usuario");
    const supaUser = supabaseUser(req);
    const { data: authData, error: authErr } = await supaUser.auth.getUser();
    console.log("[DEBUG] getUser result:", {
      hasUser: !!authData?.user,
      userId: authData?.user?.id,
      error: authErr?.message,
    });
    if (authErr || !authData.user) return unauthorized();
    userId = authData.user.id;
  }

  const { order_id, to_status, note, proof_id } = payload;
  if (!order_id || typeof order_id !== "string")
    return badRequest("order_id is required");
  if (!to_status || typeof to_status !== "string" || !isValidStatus(to_status))
    return badRequest("to_status is invalid");

  const admin = supabaseAdmin();

  // Load order
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id,business_id,status,assigned_courier_id")
    .eq("id", order_id)
    .single();

  if (orderErr || !order) return badRequest("Order not found");

  const from_status = order.status as OrderStatus;
  if (!allowedTransition(from_status, to_status)) {
    return badRequest("Transition not allowed", { from_status, to_status });
  }

  // Determine if user is business member (panel) and/or courier (app)
  const [{ data: membership }, { data: courier }] = await Promise.all([
    admin
      .from("business_members")
      .select("role,is_active")
      .eq("business_id", order.business_id)
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("couriers")
      .select("id,is_active")
      .eq("business_id", order.business_id)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const isMember = !!membership?.is_active;
  const courierId = courier?.is_active ? (courier.id as string) : null;

  // Authorization rules (MVP):
  // - Courier transitions (en_route/delivered/failed) require courier to be assigned.
  // - Panel transitions (assign/unassign/cancel) require business member.
  if (isCourierOnlyStatus(to_status)) {
    if (!courierId) return forbidden("Only couriers can set this status");
    if (!order.assigned_courier_id || order.assigned_courier_id !== courierId) {
      return forbidden("Courier is not assigned to this order");
    }
  }

  if (isPanelOnlyTransition(from_status, to_status)) {
    if (!isMember)
      return forbidden("Only business members can do this transition");
  }

  // Optional: require note on failed
  if (to_status === "failed" && (!note || note.trim().length < 3)) {
    return badRequest("note is required for failed orders");
  }

  // Optional: require proof on delivered (uncomment if you want strictness)
  // if (to_status === "delivered" && !proof_id) {
  //   return badRequest("proof_id is required to mark delivered");
  // }

  // Compute side effects
  const updates: Record<string, unknown> = { status: to_status };

  // If unassign (assigned -> pending) clear assignment
  if (from_status === "assigned" && to_status === "pending") {
    updates.assigned_courier_id = null;
    updates.assigned_at = null;
  }

  // Create event type
  const eventType =
    to_status === "canceled"
      ? "order_canceled"
      : to_status === "failed"
      ? "order_failed"
      : "status_changed";

  // Transaction-like sequence (Supabase JS doesn't do SQL tx here; keep it tight)
  const { error: updErr } = await admin
    .from("orders")
    .update(updates)
    .eq("id", order_id);
  if (updErr)
    return json(500, {
      error: "Failed to update order",
      details: updErr.message,
    });

  const { error: evErr } = await admin.from("order_events").insert({
    business_id: order.business_id,
    order_id: order.id,
    type: eventType,
    from_status,
    to_status,
    courier_id: courierId,
    note: note ?? null,
    meta: proof_id ? { proof_id } : {},
    created_by: userId,
  });

  if (evErr)
    return json(500, {
      error: "Failed to insert event",
      details: evErr.message,
    });

  // Notificaciones in-app para miembros del negocio cuando cambia el estado del pedido
  // Notificar para todos los estados importantes: assigned, en_route, delivered, failed, canceled
  console.log(
    `[NOTIFICATIONS] Status change: ${from_status} -> ${to_status}, checking if notifications needed...`
  );

  if (
    ["assigned", "en_route", "delivered", "failed", "canceled"].includes(
      to_status
    )
  ) {
    console.log(
      `[NOTIFICATIONS] Status ${to_status} requires notifications, creating...`
    );
    try {
      console.log(
        `[NOTIFICATIONS] Starting notification creation process for order ${order_id}, business ${order.business_id}`
      );

      // Obtener todos los miembros activos del negocio
      const { data: businessMembers, error: membersError } = await admin
        .from("business_members")
        .select("user_id")
        .eq("business_id", order.business_id)
        .eq("is_active", true);

      if (membersError) {
        console.error("Error fetching business members for notifications:", {
          error: membersError,
          businessId: order.business_id,
          orderId: order_id,
          toStatus: to_status,
        });
      } else if (!businessMembers || businessMembers.length === 0) {
        console.log(
          `No active business members found for business ${order.business_id}`
        );
      } else {
        console.log(
          `[NOTIFICATIONS] Found ${businessMembers.length} active business members for business ${order.business_id}`
        );

        // Obtener detalles del pedido para la notificación
        const { data: orderDetails, error: orderDetailsError } = await admin
          .from("orders")
          .select("code, assigned_courier_id")
          .eq("id", order_id)
          .single();

        if (orderDetailsError) {
          console.error(
            "[NOTIFICATIONS] Error fetching order details:",
            orderDetailsError
          );
        }

        const orderCode = orderDetails?.code || `#${order_id.slice(0, 8)}`;

        // Obtener nombre del mensajero si está asignado
        let courierName: string | null = null;
        if (orderDetails?.assigned_courier_id) {
          const { data: courierData } = await admin
            .from("couriers")
            .select("display_name")
            .eq("id", orderDetails.assigned_courier_id)
            .maybeSingle();
          courierName = courierData?.display_name || null;
        }

        // Determinar título y cuerpo según el estado
        let title: string;
        let body: string;
        let type: string;

        switch (to_status) {
          case "assigned":
            title = "Pedido asignado";
            body = courierName
              ? `El pedido ${orderCode} fue asignado a ${courierName}`
              : `El pedido ${orderCode} fue asignado`;
            type = "order_assigned";
            break;
          case "en_route":
            title = "Pedido en camino";
            body = `El pedido ${orderCode} está en camino`;
            type = "order_en_route";
            break;
          case "delivered":
            title = "Pedido entregado";
            body = `El pedido ${orderCode} ha sido entregado`;
            type = "order_delivered";
            break;
          case "failed":
            title = "Pedido fallido";
            body = `El pedido ${orderCode} falló${note ? `: ${note}` : ""}`;
            type = "order_failed";
            break;
          case "canceled":
            title = "Pedido cancelado";
            body = `El pedido ${orderCode} fue cancelado`;
            type = "order_canceled";
            break;
          default:
            title = "Estado del pedido actualizado";
            body = `El pedido ${orderCode} cambió a ${to_status}`;
            type = "order_status_changed";
        }

        // Crear notificaciones para todos los miembros del negocio
        const notifications = businessMembers.map((member) => ({
          user_id: member.user_id,
          title,
          body,
          type,
          data: {
            order_id: order_id,
            order_code: orderCode,
            from_status,
            to_status,
            courier_name: courierName,
          },
        }));

        console.log(
          `[NOTIFICATIONS] Attempting to insert ${notifications.length} notifications for order ${order_id} status change to ${to_status}`
        );

        // Insertar notificaciones directamente en la base de datos (exactamente igual que en assign/route.ts)
        const { error: insertError } = await admin
          .from("notifications")
          .insert(notifications);

        if (insertError) {
          console.error("[NOTIFICATIONS] Error inserting notifications:", {
            error: insertError,
            errorMessage: insertError.message,
            errorCode: insertError.code,
            orderId: order_id,
            toStatus: to_status,
            notificationsCount: notifications.length,
            businessId: order.business_id,
            firstNotification: notifications[0],
          });
        } else {
          console.log(
            `[NOTIFICATIONS] Successfully created ${notifications.length} notifications for business members (order ${order_id}, status: ${to_status})`
          );
        }
      }
    } catch (notifError) {
      console.error(
        "[NOTIFICATIONS] Exception creating business notifications:",
        {
          error: notifError,
          errorMessage:
            notifError instanceof Error
              ? notifError.message
              : String(notifError),
          errorStack:
            notifError instanceof Error ? notifError.stack : undefined,
          orderId: order_id,
          toStatus: to_status,
          businessId: order.business_id,
        }
      );
      // No fallar por esto
    }
  } else {
    console.log(
      `[NOTIFICATIONS] Status ${to_status} does not require notifications`
    );
  }

  // Notificación por WhatsApp al cliente (si aplica)
  // Solo para estados importantes: en_route, delivered, failed
  if (["en_route", "delivered", "failed"].includes(to_status)) {
    try {
      // Obtener detalles del pedido
      const { data: orderDetails } = await admin
        .from("orders")
        .select("code, customer_id")
        .eq("id", order_id)
        .single();

      let customerPhone: string | null = null;

      if (orderDetails?.customer_id) {
        // Obtener teléfono del cliente
        const { data: customer } = await admin
          .from("customers")
          .select("phone")
          .eq("id", orderDetails.customer_id)
          .maybeSingle();

        customerPhone = customer?.phone || null;
      }

      if (customerPhone && orderDetails) {
        // Obtener tracking link
        const { data: trackingLink } = await admin
          .from("order_tracking_links")
          .select("token")
          .eq("order_id", order_id)
          .eq("is_revoked", false)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const trackingUrl = trackingLink
          ? `${Deno.env.get("NEXT_PUBLIC_APP_URL") || ""}/track/${
              trackingLink.token
            }`
          : undefined;

        // Generar mensaje según estado
        let message = "";
        const orderCode = orderDetails.code || `#${order_id.slice(0, 8)}`;

        if (to_status === "en_route") {
          message = `🚛 *Tu pedido está en camino*\n\n`;
          message += `Pedido: *${orderCode}*\n\n`;
          message += `El mensajero ya está en camino a tu dirección.`;
          if (trackingUrl) {
            message += `\n\nSeguimiento en tiempo real: ${trackingUrl}`;
          }
        } else if (to_status === "delivered") {
          message = `✅ *Tu pedido ha sido entregado*\n\n`;
          message += `Pedido: *${orderCode}*\n\n`;
          message += `¡Gracias por tu compra! Esperamos que todo esté en orden.`;
          if (trackingUrl) {
            message += `\n\nVer detalles: ${trackingUrl}`;
          }
        } else if (to_status === "failed") {
          message = `❌ *Hubo un problema con tu pedido*\n\n`;
          message += `Pedido: *${orderCode}*\n\n`;
          message += `Lamentamos las molestias. Por favor, contacta con nosotros para resolver el problema.`;
          if (note) {
            message += `\n\nNota: ${note}`;
          }
        }

        // Enviar por WhatsApp (no bloquea si falla)
        const internalSecret = Deno.env.get("INTERNAL_API_SECRET");
        if (internalSecret && message) {
          const fnUrl = `${Deno.env.get(
            "SUPABASE_URL"
          )}/functions/v1/send_whatsapp_notification`;
          fetch(fnUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-secret": internalSecret,
            },
            body: JSON.stringify({
              phone_number: customerPhone,
              message,
              order_code: orderCode,
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
  }

  return ok({
    order_id,
    from_status,
    to_status,
    courier_id: courierId,
  });
});
