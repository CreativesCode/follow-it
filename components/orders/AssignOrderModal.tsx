"use client";

import { useState } from "react";
import { X, Loader2, UserPlus } from "lucide-react";
import { CourierSelect } from "@/components/couriers/CourierSelect";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { OrderWithRelations } from "@/types/orders";

type Props = {
  order: OrderWithRelations;
  businessId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function AssignOrderModal({
  order,
  businessId,
  onClose,
  onSuccess,
}: Props) {
  const [courierId, setCourierId] = useState<string | null>(
    order.assigned_courier_id || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAssigned = order.status === "assigned";
  const hasChanged = courierId !== (order.assigned_courier_id || null);

  const handleSubmit = async () => {
    if (!courierId && !isAssigned) {
      setError("Selecciona un mensajero");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Si se quiere desasignar
      if (!courierId && isAssigned) {
        const response = await fetch(`/api/orders/${order.id}/assign`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error);
        }
      }
      // Si se quiere asignar/reasignar
      else if (courierId) {
        // Si ya está asignado, primero desasignar
        if (isAssigned && order.assigned_courier_id !== courierId) {
          await fetch(`/api/orders/${order.id}/assign`, { method: "DELETE" });
        }

        // Asignar nuevo
        if (order.status === "pending" || isAssigned) {
          const response = await fetch(`/api/orders/${order.id}/assign`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courier_id: courierId }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error);
          }
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">
              {isAssigned ? "Cambiar Asignación" : "Asignar Mensajero"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Info del pedido */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Pedido</p>
            <p className="font-mono font-semibold">{order.code}</p>
            <p className="text-sm text-gray-600 mt-1">
              {order.dropoff_address}
            </p>
          </div>

          {/* Selector de mensajero */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mensajero
            </label>
            <CourierSelect
              businessId={businessId}
              value={courierId}
              onChange={setCourierId}
              showUnassignOption={isAssigned}
              placeholder="Seleccionar mensajero..."
            />
          </div>

          {/* Error */}
          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !hasChanged}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isAssigned && !courierId ? "Desasignar" : "Asignar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
