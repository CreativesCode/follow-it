// components/notifications/OrderAssignmentToast.tsx
// Componente para mostrar notificación cuando se asigna un pedido

"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface Order {
  id: string;
  code: string | null;
  dropoff_address: string;
}

interface OrderAssignmentToastProps {
  order: Order | null;
  onClose: () => void;
  onViewOrder?: (orderId: string) => void;
}

export function OrderAssignmentToast({
  order,
  onClose,
  onViewOrder,
}: OrderAssignmentToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (order) {
      setIsVisible(true);
      // Auto-cerrar después de 8 segundos
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Esperar animación
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [order, onClose]);

  if (!order || !isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm w-full">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-gray-900">
                ¡Nuevo pedido asignado!
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {order.code
                ? `Pedido ${order.code}`
                : `Pedido #${order.id.slice(0, 8)}`}
            </p>
            <p className="text-xs text-gray-500 line-clamp-2">
              {order.dropoff_address}
            </p>
            {onViewOrder && (
              <button
                onClick={() => {
                  onViewOrder(order.id);
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Ver pedido →
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
