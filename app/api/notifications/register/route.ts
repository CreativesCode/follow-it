import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const registerTokenSchema = z.object({
  token: z.string().min(1, "Token es requerido"),
  platform: z.enum(["ios", "android", "web"], {
    errorMap: () => ({ message: "Platform debe ser ios, android o web" }),
  }),
  device_id: z.string().optional(),
});

// POST /api/notifications/register
export async function POST(request: NextRequest) {
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
    const { token, platform, device_id } = registerTokenSchema.parse(body);

    // Check if token already exists for this user
    const { data: existingToken, error: checkError } = await supabase
      .from("device_tokens")
      .select("id, is_active")
      .eq("user_id", user.id)
      .eq("token", token)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found", which is fine
      throw checkError;
    }

    if (existingToken) {
      // Update existing token (reactivate if inactive, update last_used_at)
      const { error: updateError } = await supabase
        .from("device_tokens")
        .update({
          is_active: true,
          platform,
          device_id: device_id || null,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingToken.id);

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        action: "updated",
        token_id: existingToken.id,
      });
    } else {
      // Insert new token
      const { data: newToken, error: insertError } = await supabase
        .from("device_tokens")
        .insert({
          user_id: user.id,
          token,
          platform,
          device_id: device_id || null,
          is_active: true,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      return NextResponse.json({
        success: true,
        action: "created",
        token_id: newToken.id,
      });
    }
  } catch (error: unknown) {
    console.error("POST /api/notifications/register error:", error);

    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: "errors" in error ? error.errors : [],
        },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Error al registrar token";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/notifications/register - Desregistrar token
export async function DELETE(request: NextRequest) {
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
    const { token } = z.object({ token: z.string() }).parse(body);

    // Deactivate token instead of deleting (soft delete)
    const { error: updateError } = await supabase
      .from("device_tokens")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("token", token);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("DELETE /api/notifications/register error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al desregistrar token";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
