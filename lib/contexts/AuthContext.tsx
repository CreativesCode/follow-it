"use client";

import { createContext, useContext, ReactNode } from "react";
import { useUser } from "@/lib/hooks/useUser";
import { useUserRole } from "@/lib/hooks/useUserRole";
import { User } from "@supabase/supabase-js";
import type { BusinessMember, Courier } from "@/types/database";

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
  const { type: roleType, loading: roleLoading, businessMember, courier } =
    useUserRole();

  return (
    <AuthContext.Provider
      value={{
        user,
        userLoading,
        roleType,
        roleLoading,
        businessMember,
        courier,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
