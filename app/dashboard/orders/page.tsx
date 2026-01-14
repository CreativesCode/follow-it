import { requireBusinessRole } from "@/lib/utils/auth";
import { Suspense } from "react";
import { OrdersPageClient } from "./OrdersPageClient";

export default async function OrdersPage() {
  // Validar rol server-side
  const { businessMember } = await requireBusinessRole();

  return (
    <Suspense fallback={<OrdersPageSkeleton />}>
      <OrdersPageClient businessId={businessMember.business_id} />
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
