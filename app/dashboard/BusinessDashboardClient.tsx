"use client";

import { CouriersMap } from "@/components/map/CouriersMap";
import { OrderCard } from "@/components/orders/OrderCard";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";
import { OrderForm } from "@/components/orders/OrderForm";
import { Button } from "@/components/ui/Button";
import { useOrders } from "@/lib/hooks/useOrders";
import { useRealtimeLocations } from "@/lib/hooks/useRealtimeLocations";
import { OrderFormData } from "@/types/orders";
import {
  CheckCircle,
  Clock,
  Package,
  Plus,
  TrendingUp,
  Truck,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Props = {
  businessId: string;
};

export function BusinessDashboardClient({ businessId }: Props) {
  const router = useRouter();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Obtener todos los pedidos del negocio
  const { orders, loading, createOrder, refetch } = useOrders({
    businessId,
    status: "all",
    limit: 100, // Obtener más pedidos para estadísticas
  });

  // Obtener ubicaciones en tiempo real de los mensajeros
  const {
    couriers: couriersWithLocations,
    loading: locationsLoading,
    error: locationsError,
  } = useRealtimeLocations(businessId);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersToday = orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    return {
      today: ordersToday.length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      enRoute: orders.filter((o) => o.status === "en_route").length,
      pending: orders.filter(
        (o) => o.status === "pending" || o.status === "assigned"
      ).length,
      total: orders.length,
    };
  }, [orders]);

  // Pedidos recientes (últimos 6)
  const recentOrders = useMemo(() => {
    return orders
      .sort((a, b) => {
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      })
      .slice(0, 6);
  }, [orders]);

  // Pedidos que requieren atención (pendientes y asignados)
  const ordersNeedingAttention = useMemo(() => {
    return orders.filter(
      (o) => o.status === "pending" || o.status === "assigned"
    );
  }, [orders]);

  const handleCreateOrder = async (data: OrderFormData) => {
    const result = await createOrder(data);
    if (result.order) {
      setShowCreateModal(false);
      // Opcional: abrir el modal del pedido recién creado
      // setSelectedOrderId(result.order.id);
    }
    return result;
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-6 safe-area-bottom">
      {/* Header con acciones rápidas */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary-700">
            Dashboard
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Resumen de tu negocio
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Nuevo Pedido</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Pedidos Hoy */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <div className="shrink-0 bg-primary-100 rounded-lg p-2 md:p-3">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-primary-500" />
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-500">
                Pedidos Hoy
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.today}
              </p>
            </div>
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <div className="shrink-0 bg-yellow-100 rounded-lg p-2 md:p-3">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-500">
                Pendientes
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.pending}
              </p>
            </div>
          </div>
        </div>

        {/* En Camino */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <div className="shrink-0 bg-blue-100 rounded-lg p-2 md:p-3">
              <Truck className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-500">
                En Camino
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.enRoute}
              </p>
            </div>
          </div>
        </div>

        {/* Entregados */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <div className="shrink-0 bg-green-100 rounded-lg p-2 md:p-3">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-500">
                Entregados
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.delivered}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa de Mensajeros en Tiempo Real */}
      {couriersWithLocations.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              📍 Mensajeros en Tiempo Real
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Visualiza dónde están tus mensajeros en este momento
            </p>
          </div>
          <div className="p-4">
            {locationsLoading ? (
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">
                    Cargando ubicaciones...
                  </p>
                </div>
              </div>
            ) : locationsError ? (
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-sm">Error al cargar ubicaciones</p>
                  <p className="text-xs mt-1">{locationsError}</p>
                </div>
              </div>
            ) : (
              <CouriersMap
                couriers={couriersWithLocations}
                height="400px"
                className="w-full"
              />
            )}
          </div>
        </div>
      )}

      {/* Pedidos que requieren atención */}
      {ordersNeedingAttention.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-amber-900">
                Pedidos que requieren atención ({ordersNeedingAttention.length})
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/orders?status=pending")}
            >
              Ver todos
            </Button>
          </div>
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {ordersNeedingAttention.slice(0, 3).map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => setSelectedOrderId(order.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pedidos Recientes */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
              Pedidos Recientes
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/orders")}
          >
            Ver todos
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay pedidos aún
            </h3>
            <p className="text-gray-500 mb-4">
              Crea tu primer pedido para comenzar
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Pedido
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {recentOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => setSelectedOrderId(order.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => router.push("/dashboard/orders")}
          className="bg-white rounded-lg shadow p-4 md:p-6 hover:shadow-md transition-shadow text-left group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Gestionar Pedidos
              </h3>
              <p className="text-sm text-gray-600">
                Ver y administrar todos tus pedidos
              </p>
            </div>
            <Package className="w-6 h-6 text-gray-400 group-hover:text-primary-500 transition-colors" />
          </div>
        </button>

        <button
          onClick={() => router.push("/dashboard/couriers")}
          className="bg-white rounded-lg shadow p-4 md:p-6 hover:shadow-md transition-shadow text-left group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Gestionar Mensajeros
              </h3>
              <p className="text-sm text-gray-600">
                Invitar y administrar mensajeros
              </p>
            </div>
            <Truck className="w-6 h-6 text-gray-400 group-hover:text-primary-500 transition-colors" />
          </div>
        </button>
      </div>

      {/* Modal crear pedido */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm safe-area-inset modal-container">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90dvh] overflow-hidden flex flex-col modal-content">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-6 md:pb-8 modal-form-content">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold">
                  Crear Nuevo Pedido
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <OrderForm
                onSubmit={handleCreateOrder}
                onCancel={() => setShowCreateModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle pedido */}
      {selectedOrderId && (
        <OrderDetailModal
          key={selectedOrderId}
          orderId={selectedOrderId}
          businessId={businessId}
          onClose={() => setSelectedOrderId(null)}
          onOrderUpdate={refetch}
        />
      )}
    </div>
  );
}
