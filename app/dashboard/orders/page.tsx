import { getUserRole, requireAuth } from "@/lib/utils/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { OrdersPageClient } from "./OrdersPageClient";

export default async function OrdersPage() {
  // Validar autenticación y obtener rol
  const user = await requireAuth();
  const role = await getUserRole(user.id);

  if (!role.type) {
    redirect("/auth/onboarding");
  }

  // Obtener business_id según el rol
  let businessId: string;
  if (role.type === "business") {
    businessId = (role.data as { business_id: string }).business_id;
  } else {
    // Si es courier, también tiene business_id
    businessId = (role.data as { business_id: string }).business_id;
  }

  return (
    <Suspense fallback={<OrdersPageSkeleton />}>
      <OrdersPageClient businessId={businessId} roleType={role.type} />
    </Suspense>
  );
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
