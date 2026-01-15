// supabase/functions/get_tracking_events/index.ts
import { sha256Hex } from "../_shared/crypto.ts";
import { corsHeaders, corsOk, corsOptions, json } from "../_shared/http.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

type PublicEvent = {
  id: string;
  type: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string;
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return corsOptions();
  }

  if (req.method !== "GET")
    return json(405, { error: "Method not allowed" }, corsHeaders);

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token || token.trim().length < 16)
    return json(400, { error: "token is required" }, corsHeaders);

  const admin = supabaseAdmin();
  const token_hash = await sha256Hex(token.trim());

  // Validar token
  const { data: link, error: linkErr } = await admin
    .from("order_tracking_links")
    .select("order_id,business_id,expires_at,is_revoked")
    .eq("token_hash", token_hash)
    .maybeSingle();

  if (linkErr || !link)
    return json(403, { error: "Invalid token" }, corsHeaders);
  if (link.is_revoked) return json(403, { error: "Link revoked" }, corsHeaders);
  if (new Date(link.expires_at).getTime() < Date.now())
    return json(403, { error: "Link expired" }, corsHeaders);

  // Obtener eventos del pedido (solo información pública, sin relaciones sensibles)
  const { data: events, error: eventsError } = await admin
    .from("order_events")
    .select("id, type, from_status, to_status, note, created_at")
    .eq("order_id", link.order_id)
    .eq("business_id", link.business_id)
    .order("created_at", { ascending: false });

  if (eventsError) {
    console.error("Error fetching events:", eventsError);
    return json(500, { error: "Error al obtener eventos" }, corsHeaders);
  }

  return corsOk({ events: events || [] });
});
