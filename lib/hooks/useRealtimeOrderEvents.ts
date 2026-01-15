"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { OrderEvent } from "@/types/database";

type UseRealtimeOrderEventsProps = {
  businessId?: string;
  orderId?: string;
  courierId?: string;
  onEvent: (event: OrderEvent) => void;
  enabled?: boolean;
};

export function useRealtimeOrderEvents({
  businessId,
  orderId,
  courierId,
  onEvent,
  enabled = true,
}: UseRealtimeOrderEventsProps) {
  const handleEvent = useCallback(
    (payload: RealtimePostgresChangesPayload<OrderEvent>) => {
      if (payload.eventType === "INSERT") {
        onEvent(payload.new as OrderEvent);
      }
    },
    [onEvent]
  );

  useEffect(() => {
    if (!enabled) return;

    // Necesitamos al menos un filtro
    if (!businessId && !orderId && !courierId) return;

    const supabase = createClient();

    // Construir filtro
    let filter = "";
    if (businessId) filter = `business_id=eq.${businessId}`;
    else if (orderId) filter = `order_id=eq.${orderId}`;
    else if (courierId) filter = `courier_id=eq.${courierId}`;

    const channelName = `events-${businessId || orderId || courierId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_events",
          filter,
        },
        handleEvent
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, orderId, courierId, enabled, handleEvent]);
}
