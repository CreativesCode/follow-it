"use client";

import type { OrderEvent } from "@/types/database";
import { useCallback, useEffect, useState } from "react";

// Evento con relaciones desde la API
type OrderEventWithRelations = OrderEvent & {
  courier?: {
    id: string;
    display_name: string;
  } | null;
};

type UseOrderEventsReturn = {
  events: OrderEventWithRelations[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useOrderEvents(orderId: string | null): UseOrderEventsReturn {
  const [events, setEvents] = useState<OrderEventWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!orderId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/events`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      // Ordenar eventos por fecha (más reciente primero)
      const sortedEvents = (data.events || []).sort(
        (a: OrderEventWithRelations, b: OrderEventWithRelations) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setEvents(sortedEvents);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  };
}
