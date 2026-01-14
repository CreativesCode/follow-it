"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useOrder } from "@/lib/hooks/useOrder";
import type { OrderFormData } from "@/types/orders";
import { Edit, X } from "lucide-react";
import { useState } from "react";
import { OrderForm } from "./OrderForm";
import { OrderStatusBadge } from "./OrderStatusBadge";

type Props = {
  orderId: string | null;
  onClose: () => void;
};

export function OrderDetailModal({ orderId, onClose }: Props) {
  const { order, loading, error, updateOrder } = useOrder(orderId || "");
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleUpdate = async (data: OrderFormData) => {
    setSaveError(null);
    const result = await updateOrder(data);
    if (result.order) {
      setIsEditing(false);
      // Opcional: cerrar modal después de guardar exitosamente
      // onClose();
    } else {
      setSaveError(result.error || "Error al actualizar pedido");
    }
    return result;
  };

  if (!orderId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                <span className="text-gray-600">Cargando pedido...</span>
              </div>
            ) : error || !order ? (
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Error</h2>
                <p className="text-sm text-gray-500">
                  {error || "Pedido no encontrado"}
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Pedido {order.code || `#${order.id.slice(0, 8)}`}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Creado{" "}
                  {new Date(order.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </div>

          {order && !isEditing && (
            <div className="flex items-center gap-3">
              <OrderStatusBadge status={order.status} size="md" />
              {!["delivered", "canceled"].includes(order.status) && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Cargando pedido...</p>
              </div>
            </div>
          ) : error || !order ? (
            <div className="text-center py-12">
              <Alert variant="error">{error || "Pedido no encontrado"}</Alert>
            </div>
          ) : isEditing ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Editar Pedido
              </h3>
              {saveError && <Alert variant="error">{saveError}</Alert>}
              <OrderForm
                onSubmit={handleUpdate}
                onCancel={() => setIsEditing(false)}
                mode="edit"
                initialData={{
                  dropoff_address: order.dropoff_address,
                  pickup_address: order.pickup_address || undefined,
                  items_summary: order.items_summary || "",
                  notes: order.notes || undefined,
                  amount_cents: order.amount_cents
                    ? order.amount_cents / 100
                    : undefined,
                  customer_name: order.customer?.name || undefined,
                  customer_phone: order.customer?.phone || undefined,
                }}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Información básica */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Información del Pedido
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Dirección de Entrega
                    </p>
                    <p className="text-gray-900">{order.dropoff_address}</p>
                  </div>
                  {order.pickup_address && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Dirección de Recogida
                      </p>
                      <p className="text-gray-900">{order.pickup_address}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Items</p>
                    <p className="text-gray-900">
                      {order.items_summary || "Sin descripción"}
                    </p>
                  </div>
                  {order.amount_cents && order.amount_cents > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Monto</p>
                      <p className="text-gray-900 font-semibold">
                        ${(order.amount_cents / 100).toFixed(2)}{" "}
                        {order.currency}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cliente */}
              {order.customer && (
                <div className="border-t pt-4">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">
                    Cliente
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.customer.name && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Nombre</p>
                        <p className="text-gray-900">{order.customer.name}</p>
                      </div>
                    )}
                    {order.customer.phone && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Teléfono</p>
                        <p className="text-gray-900">{order.customer.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mensajero asignado */}
              {order.courier && (
                <div className="border-t pt-4">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">
                    Mensajero
                  </h3>
                  <p className="text-gray-900">{order.courier.display_name}</p>
                  {order.courier.phone && (
                    <p className="text-sm text-gray-500 mt-1">
                      {order.courier.phone}
                    </p>
                  )}
                </div>
              )}

              {/* Notas */}
              {order.notes && (
                <div className="border-t pt-4">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">
                    Notas
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
