"use client";

import { createClient } from "@/lib/supabase/client";
import type { BusinessMember, Courier } from "@/types/database";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "./useUser";

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
  // Memoizar la instancia de Supabase para evitar recreaciones
  const supabase = useMemo(() => createClient(), []);
  // Flag para evitar peticiones simultáneas y rastrear si el componente está montado
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);
  // Ref para el userId actual para evitar peticiones con datos obsoletos
  const currentUserIdRef = useRef<string | null>(null);

  // Extraer userId para usar como dependencia estable
  const userId = user?.id ?? null;

  useEffect(() => {
    mountedRef.current = true;

    if (userLoading) return;
    if (!user || !userId) {
      if (mountedRef.current) {
        setRole({ type: null, loading: false });
      }
      currentUserIdRef.current = null;
      return;
    }

    // Si el userId no ha cambiado y ya estamos haciendo una petición, no hacer otra
    if (currentUserIdRef.current === userId && fetchingRef.current) {
      return;
    }

    // Si el userId cambió, resetear el flag de fetching
    if (currentUserIdRef.current !== userId) {
      fetchingRef.current = false;
      currentUserIdRef.current = userId;
    }

    // Si ya estamos haciendo una petición para este usuario, no hacer otra
    if (fetchingRef.current) return;

    fetchingRef.current = true;

    async function fetchRole() {
      try {
        // Check if user is a business member
        const { data: businessMember } = await supabase
          .from("business_members")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle();

        // Verificar si el componente sigue montado y el userId no ha cambiado
        if (!mountedRef.current || currentUserIdRef.current !== userId) {
          fetchingRef.current = false;
          return;
        }

        if (businessMember) {
          setRole({
            type: "business",
            businessMember: businessMember as BusinessMember,
            loading: false,
          });
          fetchingRef.current = false;
          return;
        }

        // Check if user is a courier
        const { data: courier } = await supabase
          .from("couriers")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle();

        // Verificar si el componente sigue montado y el userId no ha cambiado
        if (!mountedRef.current || currentUserIdRef.current !== userId) {
          fetchingRef.current = false;
          return;
        }

        if (courier) {
          setRole({
            type: "courier",
            courier: courier as Courier,
            loading: false,
          });
          fetchingRef.current = false;
          return;
        }

        // No role found
        setRole({ type: null, loading: false });
        fetchingRef.current = false;
      } catch (error: any) {
        console.error("Error fetching user role:", error);
        if (mountedRef.current && currentUserIdRef.current === userId) {
          setRole({ type: null, loading: false });
        }
        fetchingRef.current = false;
      }
    }

    fetchRole();

    // Cleanup: marcar como desmontado y resetear flags
    return () => {
      mountedRef.current = false;
      fetchingRef.current = false;
    };
  }, [userId, userLoading, supabase]);

  return role;
}
