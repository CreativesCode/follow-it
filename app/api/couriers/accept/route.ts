import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Para exportación estática: estas rutas se excluyen del build
// En Capacitor, estas operaciones deben hacerse directamente con Supabase desde el cliente
export const dynamic = "force-static";
export const revalidate = false;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invitationCode } = await request.json();

    if (!invitationCode) {
      return NextResponse.json(
        { error: "Invitation code is required" },
        { status: 400 }
      );
    }

    // Call the function to accept invitation
    const { data: courierId, error: acceptError } = await supabase.rpc(
      "accept_courier_invitation",
      {
        p_invitation_code: invitationCode.toUpperCase(),
        p_user_id: user.id,
      }
    );

    if (acceptError) {
      throw acceptError;
    }

    return NextResponse.json({
      success: true,
      courierId,
    });
  } catch (error: any) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: error.message || "Error accepting invitation" },
      { status: 500 }
    );
  }
}
