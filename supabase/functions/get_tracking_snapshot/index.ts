// supabase/functions/get_tracking_snapshot/index.ts
import { supabaseAdmin } from "../_shared/supabase.ts";
import { ok, badRequest, forbidden, json } from "../_shared/http.ts";
import { sha256Hex } from "../_shared/crypto.ts";

type Snapshot = {
  order: {
    id: string;
    status: string;
    code: string | null;
    dropoff_address: string | null;
    updated_at: string;
  };
  courier?: {
    lat: number;
    lng: number;
    recorded_at: string;
    accuracy_m?: number | null;
  } | null;
};

Deno.serve(async (req) => {
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token || token.trim().length < 16)
    return badRequest("token is required");

  const admin = supabaseAdmin();
  const token_hash = await sha256Hex(token.trim());

  const { data: link, error: linkErr } = await admin
    .from("order_tracking_links")
    .select("order_id,business_id,expires_at,is_revoked")
    .eq("token_hash", token_hash)
    .maybeSingle();

  if (linkErr || !link) return forbidden("Invalid token");
  if (link.is_revoked) return forbidden("Link revoked");
  if (new Date(link.expires_at).getTime() < Date.now())
    return forbidden("Link expired");

  // Load order
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id,status,code,dropoff_address,assigned_courier_id,updated_at")
    .eq("id", link.order_id)
    .eq("business_id", link.business_id)
    .single();

  if (orderErr || !order) return forbidden("Order not found");

  let courierLoc: Snapshot["courier"] = null;

  if (order.assigned_courier_id) {
    const { data: loc } = await admin
      .from("courier_locations")
      .select("lat,lng,accuracy_m,recorded_at")
      .eq("courier_id", order.assigned_courier_id)
      .eq("business_id", link.business_id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (loc) {
      courierLoc = {
        lat: loc.lat,
        lng: loc.lng,
        recorded_at: loc.recorded_at,
        accuracy_m: loc.accuracy_m,
      };
    }
  }

  const snapshot: Snapshot = {
    order: {
      id: order.id,
      status: order.status,
      code: order.code ?? null,
      dropoff_address: order.dropoff_address ?? null,
      updated_at: order.updated_at,
    },
    courier: courierLoc,
  };

  return ok(snapshot);
});
