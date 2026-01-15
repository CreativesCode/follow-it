"use client";

// Esta página se convierte en Client Component para compatibilidad con exportación estática
// En Capacitor, la autenticación se maneja del lado del cliente
import { useAuth } from "@/lib/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CouriersPageClient from "./CouriersPageClient";

export default function CouriersPage() {
  const router = useRouter();
  const { user, userLoading, roleType, roleLoading } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [couriers, setCouriers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading || roleLoading) return;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (roleType !== "business") {
      router.replace("/dashboard");
      return;
    }

    // Load business data
    const loadData = async () => {
      const supabase = createClient();

      // Get business info
      const { data: businessMember } = await supabase
        .from("business_members")
        .select("business_id, businesses:business_id(id, name)")
        .eq("user_id", user.id)
        .single();

      if (!businessMember || !businessMember.businesses) {
        router.replace("/dashboard");
        return;
      }

      const bid = businessMember.business_id;
      const bname = (businessMember.businesses as any).name;
      setBusinessId(bid);
      setBusinessName(bname);

      // Get couriers for this business
      const { data: couriersData } = await supabase
        .from("couriers")
        .select("*")
        .eq("business_id", bid)
        .order("created_at", { ascending: false });

      // Get invitations for this business
      const { data: invitationsData } = await supabase
        .from("courier_invitations")
        .select("*")
        .eq("business_id", bid)
        .order("created_at", { ascending: false });

      setCouriers(couriersData || []);
      setInvitations(invitationsData || []);
      setLoading(false);
    };

    loadData();
  }, [user, roleType, userLoading, roleLoading, router]);

  if (userLoading || roleLoading || loading || !businessId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <CouriersPageClient
      user={user!}
      businessId={businessId}
      businessName={businessName}
      initialCouriers={couriers}
      initialInvitations={invitations}
    />
  );
}
