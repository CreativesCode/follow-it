// lib/hooks/useCourierNotifications.ts
// Hook para que los mensajeros reciban notificaciones cuando se les asigna un pedido
// Usa Supabase Realtime (GRATIS) - funciona mientras la app esté abierta

"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { useCallback, useEffect, useRef } from "react";

interface Order {
  id: string;
  code: string | null;
  status: string;
  assigned_courier_id: string | null;
  dropoff_address: string;
}

interface OrderEvent {
  id: string;
  order_id: string;
  type: string;
  courier_id: string | null;
}

interface UseCourierNotificationsOptions {
  courierId: string;
  onNewAssignment?: (order: Order) => void;
  enabled?: boolean;
}

/**
 * Hook para que los mensajeros reciban notificaciones cuando se les asigna un pedido.
 * Usa Supabase Realtime (gratis) - funciona mientras la app esté abierta.
 *
 * @example
 * ```tsx
 * const { hasNewOrder } = useCourierNotifications({
 *   courierId: myCourierId,
 *   onNewAssignment: (order) => {
 *     // Mostrar notificación visual
 *     alert(`¡Nuevo pedido asignado! ${order.code || order.id}`);
 *   }
 * });
 * ```
 */
export function useCourierNotifications({
  courierId,
  onNewAssignment,
  enabled = true,
}: UseCourierNotificationsOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !courierId) return;

    const supabase = createClient();

    // Escuchar cambios en pedidos que se asignan a este mensajero
    const channel = supabase
      .channel(`courier-notifications-${courierId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `assigned_courier_id=eq.${courierId}`,
        },
        (payload: RealtimePostgresChangesPayload<Order>) => {
          const order = payload.new as Order;
          const oldOrder = payload.old as Order;

          // Solo notificar si el pedido cambió a "assigned" y antes no estaba asignado
          if (
            order.status === "assigned" &&
            order.assigned_courier_id === courierId &&
            oldOrder.assigned_courier_id !== courierId
          ) {
            console.log("Nuevo pedido asignado:", order);
            onNewAssignment?.(order);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_events",
          filter: `courier_id=eq.${courierId}`,
        },
        (payload: RealtimePostgresChangesPayload<OrderEvent>) => {
          if (!payload.new || typeof payload.new !== "object") return;

          const event = payload.new as OrderEvent;

          // Notificar cuando se crea un evento de asignación
          if (
            "type" in event &&
            "courier_id" in event &&
            "order_id" in event &&
            event.type === "order_assigned" &&
            event.courier_id === courierId
          ) {
            // Obtener el pedido para mostrar detalles
            supabase
              .from("orders")
              .select("id, code, status, dropoff_address")
              .eq("id", event.order_id)
              .single()
              .then(({ data: order }) => {
                if (order) {
                  console.log("Nuevo pedido asignado (vía evento):", order);
                  onNewAssignment?.(order as Order);
                }
              });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Escuchando notificaciones de pedidos asignados");
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courierId, enabled, onNewAssignment]);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      const supabase = createClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  return { unsubscribe };
}
