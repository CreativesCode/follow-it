"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Order } from "@/types/orders";
import type { RealtimeChannel } from "@supabase/supabase-js";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE";

type UseRealtimeOrdersProps = {
  businessId: string;
  onInsert?: (order: Order) => void;
  onUpdate?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  enabled?: boolean;
};

export function useRealtimeOrders({
  businessId,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: UseRealtimeOrdersProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Order>) => {
      const event = payload.eventType as RealtimeEvent;

      switch (event) {
        case "INSERT":
          onInsert?.(payload.new as Order);
          break;
        case "UPDATE":
          onUpdate?.(payload.new as Order);
          break;
        case "DELETE":
          onDelete?.(payload.old as Order);
          break;
      }
    },
    [onInsert, onUpdate, onDelete]
  );

  useEffect(() => {
    if (!enabled || !businessId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`orders-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `business_id=eq.${businessId}`,
        },
        handleChange
      )
      .subscribe((status) => {
        console.log("Orders realtime status:", status);
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, enabled, handleChange]);

  // Función para desuscribirse manualmente
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      const supabase = createClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  return { unsubscribe };
}
