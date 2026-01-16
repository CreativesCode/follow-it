"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { OrdersPageClient } from "./OrdersPageClient";

export default function OrdersPage() {
  const { user, userLoading, roleType, roleLoading, businessMember, courier } =
    useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userLoading || roleLoading) return;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (!roleType) {
      router.replace("/auth/onboarding");
      return;
    }
  }, [user, roleType, userLoading, roleLoading, router]);

  if (userLoading || roleLoading || !user || !roleType) {
    return <OrdersPageSkeleton />;
  }

  // Obtener business_id según el rol
  const businessId =
    roleType === "business"
      ? businessMember?.business_id
      : courier?.business_id;

  if (!businessId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Error: No se pudo obtener el business_id</p>
        </div>
      </div>
    );
  }

  return <OrdersPageClient businessId={businessId} roleType={roleType} />;
}

function OrdersPageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
