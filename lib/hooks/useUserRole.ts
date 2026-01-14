"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./useUser";
import type { BusinessMember, Courier } from "@/types/database";

type UserRole = {
  type: "business" | "courier" | null;
  businessMember?: BusinessMember;
  courier?: Courier;
  loading: boolean;
};

export function useUserRole(): UserRole {
  const { user, loading: userLoading } = useUser();
  const [role, setRole] = useState<UserRole>({
    type: null,
    loading: true,
  });
  const supabase = createClient();

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setRole({ type: null, loading: false });
      return;
    }

    async function fetchRole() {
      // Check if user is a business member
      const { data: businessMember } = await supabase
        .from("business_members")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .maybeSingle();

      if (businessMember) {
        setRole({
          type: "business",
          businessMember: businessMember as BusinessMember,
          loading: false,
        });
        return;
      }

      // Check if user is a courier
      const { data: courier } = await supabase
        .from("couriers")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .maybeSingle();

      if (courier) {
        setRole({
          type: "courier",
          courier: courier as Courier,
          loading: false,
        });
        return;
      }

      // No role found
      setRole({ type: null, loading: false });
    }

    fetchRole();
  }, [user, userLoading, supabase]);

  return role;
}
