"use client";

import { BusinessDashboardClient } from "@/app/dashboard/BusinessDashboardClient";
import { CourierTrackingIndicator } from "@/components/couriers/CourierTrackingIndicator";
import { OrderCard } from "@/components/orders/OrderCard";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useLocationTracking } from "@/lib/hooks/useLocationTracking";
import { useOrders } from "@/lib/hooks/useOrders";
import { Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function DashboardPageClient() {
  const router = useRouter();
  const { user, userLoading, roleType, roleLoading, courier, businessMember } =
    useAuth();

  // Para mensajeros: obtener pedidos y tracking
  const { orders, loading: ordersLoading } = useOrders({
    status: "all", // Ver todos los estados
  });

  // Filtrar pedidos activos (assigned o en_route)
  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status === "assigned" || order.status === "en_route"
      ),
    [orders]
  );

  const hasActiveOrders = activeOrders.length > 0;

  // Hook de tracking GPS (solo para mensajeros)
  const {
    isTracking,
    lastLocation,
    error: trackingError,
    offlineQueueSize,
  } = useLocationTracking(roleType === "courier" ? hasActiveOrders : false);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading || roleLoading) return;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // If user has no role, redirect to onboarding
    if (!roleType) {
      router.replace("/auth/onboarding");
    }
  }, [user, roleType, userLoading, roleLoading, router]);

  if (userLoading || roleLoading || !user || !roleType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si es usuario negocio, mostrar el dashboard del negocio
  if (roleType === "business" && businessMember?.business_id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="p-4 md:p-6 lg:p-8">
          <BusinessDashboardClient businessId={businessMember.business_id} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="p-4 md:p-6 lg:p-8">
        <div className="space-y-4 md:space-y-6">
          {/* Welcome Message */}
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold text-primary-700 mb-2">
              ¡Bienvenido al Dashboard!
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              Aquí podrás ver tus asignaciones, actualizar estados y subir
              comprobantes de entrega.
            </p>
          </div>

          {/* Contenido para mensajeros */}
          {roleType === "courier" && (
            <div className="space-y-6">
              {/* Indicador de Tracking GPS */}
              {courier && (
                <CourierTrackingIndicator
                  isTracking={isTracking}
                  lastLocation={lastLocation}
                  error={trackingError}
                  offlineQueueSize={offlineQueueSize}
                />
              )}

              {/* Pedidos Asignados */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Mis Pedidos
                </h3>

                {ordersLoading ? (
                  <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-40 bg-gray-100 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes pedidos asignados
                    </h3>
                    <p className="text-gray-500">
                      Cuando te asignen un pedido, aparecerá aquí
                    </p>
                  </div>
                ) : (
                  <>
                    {activeOrders.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">
                          Pedidos activos ({activeOrders.length})
                        </p>
                        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                          {activeOrders.map((order) => (
                            <OrderCard
                              key={order.id}
                              order={order}
                              onClick={() => setSelectedOrderId(order.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {orders.filter(
                      (o) => o.status !== "assigned" && o.status !== "en_route"
                    ).length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Otros pedidos (
                          {
                            orders.filter(
                              (o) =>
                                o.status !== "assigned" &&
                                o.status !== "en_route"
                            ).length
                          }
                          )
                        </p>
                        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                          {orders
                            .filter(
                              (o) =>
                                o.status !== "assigned" &&
                                o.status !== "en_route"
                            )
                            .map((order) => (
                              <OrderCard
                                key={order.id}
                                order={order}
                                onClick={() => setSelectedOrderId(order.id)}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal detalle pedido (para mensajeros) */}
      {roleType === "courier" && selectedOrderId && courier && (
        <OrderDetailModal
          key={selectedOrderId}
          orderId={selectedOrderId}
          businessId={courier.business_id}
          onClose={() => setSelectedOrderId(null)}
          onOrderUpdate={() => {
            // Refetch se maneja automáticamente por useOrders
          }}
        />
      )}
    </div>
  );
}
