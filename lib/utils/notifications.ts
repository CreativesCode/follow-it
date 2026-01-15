// lib/utils/notifications.ts
// Helper function to send push notifications via Edge Function

export interface SendNotificationParams {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Sends a push notification to a user via Supabase Edge Function
 * This function requires the SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set
 */
export async function sendPushNotification(
  params: SendNotificationParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      console.error("NEXT_PUBLIC_SUPABASE_URL is not set");
      return { success: false, error: "Supabase URL not configured" };
    }

    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set");
      return { success: false, error: "Service role key not configured" };
    }

    const functionUrl = `${supabaseUrl}/functions/v1/send_push_notification`;

    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to send notification:", errorData);
      return {
        success: false,
        error: errorData.error || "Failed to send notification",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
