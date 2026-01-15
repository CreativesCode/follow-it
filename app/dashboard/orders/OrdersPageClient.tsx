"use client";

import { OrderCard } from "@/components/orders/OrderCard";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { OrderForm } from "@/components/orders/OrderForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useOrders } from "@/lib/hooks/useOrders";
import { OrderFormData } from "@/types/orders";
import { LayoutGrid, List, Package, Plus, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  businessId: string;
};

type ViewMode = "list" | "kanban";

export function OrdersPageClient({ businessId }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderIdFromUrl = searchParams.get("orderId");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [urlProcessed, setUrlProcessed] = useState(false);

  const {
    orders,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    createOrder,
    refetch,
  } = useOrders({ businessId });

  // Procesar orderId de la URL una sola vez
  useEffect(() => {
    if (orderIdFromUrl && !urlProcessed) {
      // Usar startTransition para evitar el warning de React
      setSelectedOrderId(orderIdFromUrl);
      setUrlProcessed(true);

      // Limpiar el parámetro de la URL sin recargar la página
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("orderId");
      const newUrl = newSearchParams.toString()
        ? `/dashboard/orders?${newSearchParams.toString()}`
        : "/dashboard/orders";
      router.replace(newUrl, { scroll: false });
    } else if (!orderIdFromUrl && urlProcessed) {
      // Reset cuando ya no hay orderId en la URL
      setUrlProcessed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderIdFromUrl]);

  const effectiveOrderId = selectedOrderId;

  const handleCreateOrder = async (data: OrderFormData) => {
    const result = await createOrder(data);
    if (result.order) {
      setShowCreateModal(false);
    }
    return result;
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Pedidos
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            {pagination.total} pedido{pagination.total !== 1 ? "s" : ""} en
            total
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Toggle vista - Solo en desktop */}
          <div className="hidden md:flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${
                viewMode === "list"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-2 ${
                viewMode === "kanban"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>

          {/* Crear pedido */}
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 md:flex-initial"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nuevo Pedido</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <OrderFilters filters={filters} onFilterChange={setFilters} />

      {/* Error */}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Lista de pedidos */}
      {loading ? (
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-40 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState onCreateClick={() => setShowCreateModal(true)} />
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => setSelectedOrderId(order.id)}
            />
          ))}
        </div>
      )}

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setFilters({ ...filters, page: pagination.page - 1 })
            }
            disabled={pagination.page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              setFilters({ ...filters, page: pagination.page + 1 })
            }
            disabled={pagination.page >= pagination.totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Modal crear pedido */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm safe-area-inset">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
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

      {/* Modal detalle/editar pedido */}
      {effectiveOrderId && (
        <OrderDetailModal
          key={effectiveOrderId} // Key para resetear estado al cambiar orden
          orderId={effectiveOrderId}
          businessId={businessId}
          onClose={() => {
            setSelectedOrderId(null);
          }}
          onOrderUpdate={refetch}
        />
      )}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Package className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos</h3>
      <p className="text-gray-500 mb-4">
        Crea tu primer pedido para comenzar a gestionar entregas
      </p>
      <Button onClick={onCreateClick}>
        <Plus className="w-4 h-4 mr-2" />
        Crear Pedido
      </Button>
    </div>
  );
}
