import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { courierEmail, courierName, businessId } = await request.json();

    // Verify user is a member of the business
    const { data: membership } = await supabase
      .from("business_members")
      .select("role")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this business" },
        { status: 403 }
      );
    }

    // Generate invitation code
    const { data: codeData, error: codeError } = await supabase
      .rpc("generate_invitation_code");

    if (codeError) {
      throw codeError;
    }

    const invitationCode = codeData as string;

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase
      .from("courier_invitations")
      .insert({
        business_id: businessId,
        created_by: user.id,
        invitation_code: invitationCode,
        courier_email: courierEmail || null,
        courier_name: courierName || null,
        status: "pending",
      })
      .select()
      .single();

    if (invitationError) {
      throw invitationError;
    }

    return NextResponse.json({
      success: true,
      invitation,
    });
  } catch (error: any) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: error.message || "Error creating invitation" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    // Verify user is a member of the business
    const { data: membership } = await supabase
      .from("business_members")
      .select("role")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this business" },
        { status: 403 }
      );
    }

    // Get invitations for this business
    const { data: invitations, error: invitationsError } = await supabase
      .from("courier_invitations")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (invitationsError) {
      throw invitationsError;
    }

    return NextResponse.json({
      success: true,
      invitations,
    });
  } catch (error: any) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: error.message || "Error fetching invitations" },
      { status: 500 }
    );
  }
}
