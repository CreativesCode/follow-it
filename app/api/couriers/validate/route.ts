import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { invitationCode } = await request.json();

    if (!invitationCode) {
      return NextResponse.json(
        { error: "Invitation code is required" },
        { status: 400 }
      );
    }

    // Validate invitation code
    const { data: invitation, error: invitationError } = await supabase
      .from("courier_invitations")
      .select(
        `
        *,
        businesses:business_id (
          id,
          name
        )
      `
      )
      .eq("invitation_code", invitationCode.toUpperCase())
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (invitationError) {
      throw invitationError;
    }

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation code", valid: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      invitation,
    });
  } catch (error: any) {
    console.error("Error validating invitation:", error);
    return NextResponse.json(
      { error: error.message || "Error validating invitation" },
      { status: 500 }
    );
  }
}
