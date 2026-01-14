// supabase/functions/create_proof_upload/index.ts
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
  proof_type: "photo" | "signature";
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

  const { order_id, proof_type } = payload ?? ({} as Payload);
  if (!order_id || typeof order_id !== "string")
    return badRequest("order_id is required");
  if (!proof_type || !["photo", "signature"].includes(proof_type))
    return badRequest("proof_type must be 'photo' or 'signature'");

  const admin = supabaseAdmin();

  // Load order
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id,business_id,assigned_courier_id")
    .eq("id", order_id)
    .single();

  if (orderErr || !order) return badRequest("Order not found");

  // Verify user is courier assigned to this order
  const userId = authData.user.id;
  const { data: courier, error: courierErr } = await admin
    .from("couriers")
    .select("id,business_id,is_active")
    .eq("business_id", order.business_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (courierErr || !courier || !courier.is_active) {
    return forbidden("Only active couriers can upload proofs");
  }

  if (order.assigned_courier_id !== courier.id) {
    return forbidden("Courier is not assigned to this order");
  }

  // Generate storage path
  const fileId = crypto.randomUUID();
  const extension = proof_type === "photo" ? "jpg" : "png";
  const storage_path = `proofs/${order.business_id}/${order.id}/${fileId}.${extension}`;

  // Return storage path - client will upload directly using Storage API
  // RLS policies on Storage bucket will validate the upload
  // Alternative: You can implement signed URLs here if needed
  
  return ok({
    order_id,
    proof_type,
    storage_path,
    message: "Upload file directly to Storage using storage_path",
    upload_instructions: {
      bucket: "proofs",
      path: storage_path,
      method: "POST",
      endpoint: `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/proofs/${storage_path}`,
    },
  });
});
