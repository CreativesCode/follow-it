"use client";

import type { OrderWithRelations } from "@/types/orders";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, MapPin, Package, User } from "lucide-react";
import { OrderStatusBadge } from "./OrderStatusBadge";

type Props = {
  order: OrderWithRelations;
  onClick?: () => void;
  selected?: boolean;
};

export function OrderCard({ order, onClick, selected }: Props) {
  const handleClick = () => {
    onClick?.();
  };

  return (
    <div
      onClick={handleClick}
      className={`
        p-3 md:p-4 rounded-lg border cursor-pointer transition-all
        active:scale-[0.98] touch-manipulation
        hover:shadow-md hover:border-blue-300
        ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}
      `}
    >
      {/* Header: Código + Estado */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono font-semibold text-gray-900">
          {order.code || `#${order.id.slice(0, 8)}`}
        </span>
        <OrderStatusBadge status={order.status} size="sm" />
      </div>

      {/* Dirección */}
      <div className="flex items-start gap-2 mb-2">
        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-700 line-clamp-2">
          {order.dropoff_address}
        </p>
      </div>

      {/* Items */}
      {order.items_summary && (
        <div className="flex items-start gap-2 mb-2">
          <Package className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-600 line-clamp-1">
            {order.items_summary}
          </p>
        </div>
      )}

      {/* Footer: Mensajero + Tiempo */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        {/* Mensajero asignado */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <User className="w-4 h-4" />
          <span>{order.courier?.display_name || "Sin asignar"}</span>
        </div>

        {/* Tiempo */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>
            {formatDistanceToNow(new Date(order.updated_at), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        </div>
      </div>

      {/* Monto (si existe) */}
      {order.amount_cents && order.amount_cents > 0 && (
        <div className="mt-2 text-right">
          <span className="text-sm font-semibold text-green-600">
            ${(order.amount_cents / 100).toFixed(2)} {order.currency}
          </span>
        </div>
      )}
    </div>
  );
}
