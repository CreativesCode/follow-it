// supabase/functions/assign_order/index.ts
import { supabaseAdmin, supabaseUser } from "../_shared/supabase.ts";
import {
  ok,
  badRequest,
  unauthorized,
  forbidden,
  json,
} from "../_shared/http.ts";

type Payload = {
  order_id: string;
  courier_id: string;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supaUser = supabaseUser(req);
  const { data: authData, error: authErr } = await supaUser.auth.getUser();
  if (authErr || !authData.user) return unauthorized();

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { order_id, courier_id } = payload ?? ({} as Payload);
  if (!order_id || typeof order_id !== "string")
    return badRequest("order_id is required");
  if (!courier_id || typeof courier_id !== "string")
    return badRequest("courier_id is required");

  const admin = supabaseAdmin();

  // Load order
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id,business_id,status,assigned_courier_id")
    .eq("id", order_id)
    .single();

  if (orderErr || !order) return badRequest("Order not found");

  // Verify user is business member
  const userId = authData.user.id;
  const { data: membership } = await admin
    .from("business_members")
    .select("role,is_active")
    .eq("business_id", order.business_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership?.is_active) {
    return forbidden("Only business members can assign orders");
  }

  // Verify courier exists and belongs to same business
  const { data: courier, error: courierErr } = await admin
    .from("couriers")
    .select("id,business_id,is_active")
    .eq("id", courier_id)
    .eq("business_id", order.business_id)
    .single();

  if (courierErr || !courier || !courier.is_active) {
    return badRequest("Courier not found or inactive");
  }

  // Update order
  const { error: updErr } = await admin
    .from("orders")
    .update({
      status: "assigned",
      assigned_courier_id: courier_id,
      assigned_at: new Date().toISOString(),
    })
    .eq("id", order_id);

  if (updErr)
    return json(500, {
      error: "Failed to assign order",
      details: updErr.message,
    });

  // Create event
  const { error: evErr } = await admin.from("order_events").insert({
    business_id: order.business_id,
    order_id: order.id,
    type: "order_assigned",
    from_status: order.status,
    to_status: "assigned",
    courier_id: courier_id,
    created_by: userId,
  });

  if (evErr)
    return json(500, {
      error: "Failed to create event",
      details: evErr.message,
    });

  return ok({
    order_id,
    courier_id,
    status: "assigned",
  });
});
