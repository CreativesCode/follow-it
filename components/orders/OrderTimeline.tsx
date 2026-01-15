"use client";

import { useOrderEvents } from "@/lib/hooks/useOrderEvents";
import type { OrderEventType, OrderStatus } from "@/types/database";
import { ORDER_STATUS_CONFIG } from "@/types/orders";
import {
  Ban,
  Camera,
  CheckCircle,
  Clock,
  MessageSquare,
  Package,
  Play,
  Truck,
  UserMinus,
  UserPlus,
  XCircle,
} from "lucide-react";
import { OrderStatusBadge } from "./OrderStatusBadge";

// Tipo para evento con relaciones
type OrderEventWithRelations = {
  id: string;
  business_id: string;
  order_id: string;
  type: OrderEventType;
  from_status: string | null;
  to_status: string | null;
  courier_id: string | null;
  note: string | null;
  meta: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  courier?: {
    id: string;
    display_name: string;
  } | null;
};

type Props = {
  orderId: string | null;
};

// Configuración de iconos y etiquetas por tipo de evento
const EVENT_CONFIG: Record<
  OrderEventType,
  { icon: typeof Clock; label: string; color: string }
> = {
  order_created: {
    icon: Package,
    label: "Pedido creado",
    color: "text-blue-600 bg-blue-100",
  },
  order_assigned: {
    icon: UserPlus,
    label: "Asignado a mensajero",
    color: "text-green-600 bg-green-100",
  },
  order_unassigned: {
    icon: UserMinus,
    label: "Desasignado",
    color: "text-gray-600 bg-gray-100",
  },
  courier_accepted: {
    icon: CheckCircle,
    label: "Mensajero aceptó",
    color: "text-green-600 bg-green-100",
  },
  status_changed: {
    icon: Play,
    label: "Estado cambiado",
    color: "text-blue-600 bg-blue-100",
  },
  proof_uploaded: {
    icon: Camera,
    label: "Comprobante subido",
    color: "text-purple-600 bg-purple-100",
  },
  note_added: {
    icon: MessageSquare,
    label: "Nota agregada",
    color: "text-amber-600 bg-amber-100",
  },
  order_canceled: {
    icon: Ban,
    label: "Pedido cancelado",
    color: "text-red-600 bg-red-100",
  },
  order_failed: {
    icon: XCircle,
    label: "Entrega fallida",
    color: "text-red-600 bg-red-100",
  },
};

// Formatear fecha relativa
function formatRelativeTime(date: string): string {
  const now = new Date();
  const eventDate = new Date(date);
  const diffMs = now.getTime() - eventDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Hace unos segundos";
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
  if (diffHours < 24)
    return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;

  return eventDate.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: eventDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Formatear fecha completa con hora
function formatFullDate(date: string): string {
  return new Date(date).toLocaleString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Traducir estado al español
function translateStatus(status: string | null): string {
  if (!status) return "";
  const config = ORDER_STATUS_CONFIG[status as OrderStatus];
  return config?.label || status;
}

// Obtener mensaje del evento
function getEventMessage(event: OrderEventWithRelations): string {
  const config = EVENT_CONFIG[event.type];

  switch (event.type) {
    case "order_assigned":
      if (event.courier?.display_name) {
        return `Asignado a ${event.courier.display_name}`;
      }
      return config.label;

    case "order_unassigned":
      if (event.courier?.display_name) {
        return `Desasignado de ${event.courier.display_name}`;
      }
      return config.label;

    case "status_changed":
      if (event.from_status && event.to_status) {
        const fromLabel = translateStatus(event.from_status);
        const toLabel = translateStatus(event.to_status);
        return `De ${fromLabel} a ${toLabel}`;
      }
      return config.label;

    case "proof_uploaded":
      if (
        event.meta &&
        typeof event.meta === "object" &&
        "proof_type" in event.meta
      ) {
        const proofType = event.meta.proof_type as string;
        return `Comprobante ${proofType === "photo" ? "foto" : "firma"} subido`;
      }
      return config.label;

    case "note_added":
    case "order_failed":
      if (event.note) {
        return event.note;
      }
      return config.label;

    default:
      return config.label;
  }
}

export function OrderTimeline({ orderId }: Props) {
  const { events, loading, error } = useOrderEvents(orderId);

  if (!orderId) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Cargando eventos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700">Error al cargar eventos: {error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">No hay eventos registrados</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Línea vertical del timeline */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

      {/* Eventos */}
      <div className="space-y-6">
        {events.map((event) => {
          const config = EVENT_CONFIG[event.type];
          const Icon = config.icon;
          const message = getEventMessage(event);

          return (
            <div key={event.id} className="relative flex items-start gap-4">
              {/* Icono del evento */}
              <div
                className={`
                  relative z-10 flex items-center justify-center
                  w-10 h-10 rounded-full
                  ${config.color}
                  border-2 border-white shadow-sm
                `}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Contenido del evento */}
              <div className="flex-1 min-w-0 pb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {config.label}
                      </h4>
                      <p className="text-sm text-gray-600 mt-0.5">{message}</p>
                    </div>
                    <div className="text-right">
                      <time
                        className="block text-xs text-gray-500 whitespace-nowrap"
                        title={formatFullDate(event.created_at)}
                      >
                        {formatRelativeTime(event.created_at)}
                      </time>
                      <time className="block text-xs text-gray-400 mt-0.5 whitespace-nowrap">
                        {formatFullDate(event.created_at)}
                      </time>
                    </div>
                  </div>

                  {/* Status badge si hay cambio de estado */}
                  {event.from_status && event.to_status && (
                    <div className="flex items-center gap-2 mt-2">
                      <OrderStatusBadge status={event.from_status} size="sm" />
                      <span className="text-gray-400">→</span>
                      <OrderStatusBadge status={event.to_status} size="sm" />
                    </div>
                  )}

                  {/* Nota adicional */}
                  {event.note &&
                    event.type !== "note_added" &&
                    event.type !== "order_failed" && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {event.note}
                        </p>
                      </div>
                    )}

                  {/* Mensajero si aplica */}
                  {event.courier?.display_name && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <Truck className="w-3 h-3" />
                      <span>{event.courier.display_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
