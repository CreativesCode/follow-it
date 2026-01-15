import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread_only") === "true";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error querying notifications:", {
        error,
        userId: user.id,
        query: { unreadOnly, limit },
      });
      throw error;
    }

    console.log(`Found ${notifications?.length || 0} notifications for user ${user.id}`);

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error: unknown) {
    console.error("GET /api/notifications error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al obtener notificaciones";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { notification_ids, mark_all_read } = body;

    if (mark_all_read) {
      // Mark all unread notifications as read
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (updateError) throw updateError;

      return NextResponse.json({ success: true, message: "Todas las notificaciones marcadas como leídas" });
    }

    if (notification_ids && Array.isArray(notification_ids) && notification_ids.length > 0) {
      // Mark specific notifications as read
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .in("id", notification_ids);

      if (updateError) throw updateError;

      return NextResponse.json({ success: true, message: "Notificaciones marcadas como leídas" });
    }

    return NextResponse.json(
      { error: "notification_ids o mark_all_read es requerido" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("PATCH /api/notifications error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al actualizar notificaciones";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
