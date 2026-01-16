"use client";

import { useUser } from "@/lib/hooks/useUser";
import { useUserRole } from "@/lib/hooks/useUserRole";
import type { BusinessMember, Courier } from "@/types/database";
import { User } from "@supabase/supabase-js";
import { ReactNode, createContext, useContext, useMemo } from "react";

type AuthContextType = {
  user: User | null;
  userLoading: boolean;
  roleType: "business" | "courier" | null;
  roleLoading: boolean;
  businessMember?: BusinessMember;
  courier?: Courier;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const {
    type: roleType,
    loading: roleLoading,
    businessMember,
    courier,
  } = useUserRole();

  // Memoizar el valor del contexto para evitar re-renders innecesarios
  const contextValue = useMemo(
    () => ({
      user,
      userLoading,
      roleType,
      roleLoading,
      businessMember,
      courier,
    }),
    [user, userLoading, roleType, roleLoading, businessMember, courier]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
