import { requireAuth, getUserRole } from "@/lib/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CouriersPageClient from "./CouriersPageClient";

export default async function CouriersPage() {
  const user = await requireAuth();
  const role = await getUserRole(user.id);

  // Only business users can access this page
  if (role.type !== "business") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Get business info
  const { data: businessMember } = await supabase
    .from("business_members")
    .select("business_id, businesses:business_id(id, name)")
    .eq("user_id", user.id)
    .single();

  if (!businessMember || !businessMember.businesses) {
    redirect("/dashboard");
  }

  const businessId = businessMember.business_id;
  const businessName = (businessMember.businesses as any).name;

  // Get couriers for this business
  const { data: couriers } = await supabase
    .from("couriers")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  // Get invitations for this business
  const { data: invitations } = await supabase
    .from("courier_invitations")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  return (
    <CouriersPageClient
      user={user}
      businessId={businessId}
      businessName={businessName}
      initialCouriers={couriers || []}
      initialInvitations={invitations || []}
    />
  );
}
