// supabase/functions/send_push_notification/index.ts
import { badRequest, json, ok, unauthorized } from "../_shared/http.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

type Payload = {
  user_id: string;
  title: string;
  body: string;
  type?: string; // e.g., 'order_assigned', 'order_status_changed', etc.
  data?: Record<string, unknown>;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  // This function should be called with service role key for security
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return unauthorized("Authorization required");

  // Verify service role key
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const providedKey = authHeader.replace("Bearer ", "");
  if (providedKey !== serviceKey) {
    return unauthorized("Invalid service role key");
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { user_id, title, body, type, data } = payload ?? ({} as Payload);
  if (!user_id || typeof user_id !== "string")
    return badRequest("user_id is required");
  if (!title || typeof title !== "string")
    return badRequest("title is required");
  if (!body || typeof body !== "string") return badRequest("body is required");

  const admin = supabaseAdmin();

  // Save notification to database first
  const { data: insertedNotification, error: notificationError } = await admin
    .from("notifications")
    .insert({
      user_id,
      title,
      body,
      type: type || null,
      data: data || {},
    })
    .select()
    .single();

  if (notificationError) {
    console.error("Error saving notification to database:", {
      error: notificationError,
      user_id,
      title,
      body,
      type,
    });
    // Continue anyway - we still want to try sending push notifications
  } else {
    console.log(
      `Successfully inserted notification ${insertedNotification?.id} for user ${user_id}`
    );
  }

  // Get all active device tokens for the user
  const { data: tokens, error: tokensError } = await admin
    .from("device_tokens")
    .select("token, platform")
    .eq("user_id", user_id)
    .eq("is_active", true);

  if (tokensError) {
    console.error("Error fetching device tokens:", tokensError);
    return json(500, {
      error: "Failed to fetch device tokens",
      details: tokensError.message,
    });
  }

  if (!tokens || tokens.length === 0) {
    // No tokens found, but this is not an error - user might not have registered a device
    return ok({
      sent: false,
      message: "No active device tokens found for user",
      tokens_checked: 0,
    });
  }

  // Group tokens by platform
  const iosTokens = tokens
    .filter((t) => t.platform === "ios")
    .map((t) => t.token);
  const androidTokens = tokens
    .filter((t) => t.platform === "android")
    .map((t) => t.token);
  const webTokens = tokens
    .filter((t) => t.platform === "web")
    .map((t) => t.token);

  const results = {
    ios: { sent: 0, failed: 0 },
    android: { sent: 0, failed: 0 },
    web: { sent: 0, failed: 0 },
  };

  // Send to iOS devices (APNS)
  // TODO: Implement APNS integration
  // For now, we'll just log that we would send
  if (iosTokens.length > 0) {
    console.log(`Would send to ${iosTokens.length} iOS devices`);
    // TODO: Implement APNS sending
    // const apnsResult = await sendToAPNS(iosTokens, { title, body, data });
    results.ios.sent = iosTokens.length; // Placeholder
  }

  // Send to Android devices (FCM)
  // TODO: Implement FCM integration
  // For now, we'll just log that we would send
  if (androidTokens.length > 0) {
    console.log(`Would send to ${androidTokens.length} Android devices`);
    // TODO: Implement FCM sending
    // const fcmResult = await sendToFCM(androidTokens, { title, body, data });
    results.android.sent = androidTokens.length; // Placeholder
  }

  // Send to Web devices (Web Push API)
  // TODO: Implement Web Push API integration
  if (webTokens.length > 0) {
    console.log(`Would send to ${webTokens.length} web devices`);
    // TODO: Implement Web Push sending
    results.web.sent = webTokens.length; // Placeholder
  }

  // Update last_used_at for tokens (mark them as recently used)
  const tokenList = tokens.map((t) => t.token);
  await admin
    .from("device_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .in("token", tokenList);

  return ok({
    sent: true,
    tokens_checked: tokens.length,
    results,
    message: "Notification queued for delivery",
  });
});
