// supabase/functions/create_tracking_link/index.ts
import { sha256Hex } from "../_shared/crypto.ts";
import {
  badRequest,
  forbidden,
  json,
  ok,
  unauthorized,
} from "../_shared/http.ts";
import { supabaseAdmin, supabaseUser } from "../_shared/supabase.ts";

type Payload = {
  order_id: string;
  expires_in_minutes?: number; // default 24 hours
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  // Parse payload
  let payload: Payload & { _user_id?: string };
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

  // Extract payload fields (excluding _user_id)
  const { _user_id, ...payloadClean } = payload;
  const { order_id, expires_in_minutes = 1440 } =
    payloadClean ?? ({} as Payload); // default 24h
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
    tracking_url: `${Deno.env
      .get("SUPABASE_URL")
      ?.replace(
        "/rest/v1",
        ""
      )}/functions/v1/get_tracking_snapshot?token=${token}`,
  });
});
