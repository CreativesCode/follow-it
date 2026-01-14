// supabase/functions/create_tracking_link/index.ts
import { supabaseAdmin, supabaseUser } from "../_shared/supabase.ts";
import {
  ok,
  badRequest,
  unauthorized,
  forbidden,
  json,
} from "../_shared/http.ts";
import { sha256Hex } from "../_shared/crypto.ts";

type Payload = {
  order_id: string;
  expires_in_minutes?: number; // default 24 hours
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

  const { order_id, expires_in_minutes = 1440 } = payload ?? ({} as Payload); // default 24h
  if (!order_id || typeof order_id !== "string")
    return badRequest("order_id is required");

  const admin = supabaseAdmin();

  // Load order
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id,business_id")
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
    return forbidden("Only business members can create tracking links");
  }

  // Generate token (crypto.randomUUID is available in Deno)
  const token = crypto.randomUUID() + "-" + crypto.randomUUID();
  const token_hash = await sha256Hex(token);

  // Calculate expiration
  const expires_at = new Date();
  expires_at.setMinutes(expires_at.getMinutes() + expires_in_minutes);

  // Insert tracking link
  const { data: link, error: linkErr } = await admin
    .from("order_tracking_links")
    .insert({
      business_id: order.business_id,
      order_id: order.id,
      token_hash,
      expires_at: expires_at.toISOString(),
      created_by: userId,
    })
    .select("id")
    .single();

  if (linkErr || !link)
    return json(500, {
      error: "Failed to create tracking link",
      details: linkErr?.message,
    });

  // Return token only once (never store raw token in DB)
  return ok({
    tracking_link_id: link.id,
    token, // Only returned once!
    expires_at: expires_at.toISOString(),
    tracking_url: `${Deno.env.get("SUPABASE_URL")?.replace("/rest/v1", "")}/functions/v1/get_tracking_snapshot?token=${token}`,
  });
});
