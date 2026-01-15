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

  return ok({
    order_id,
    from_status,
    to_status,
    courier_id: courierId,
  });
});
