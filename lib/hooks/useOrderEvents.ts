"use client";

import { createClient } from "@/lib/supabase/client";
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
      const supabase = createClient();

      // Obtener usuario autenticado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("No autorizado");
      }

      // Obtener eventos del pedido con relaciones
      const { data: events, error } = await supabase
        .from("order_events")
        .select(
          `
          *,
          courier:couriers!order_events_courier_id_fkey(id, display_name)
        `
        )
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Ordenar eventos por fecha (más reciente primero)
      const sortedEvents = (events || []).sort(
        (a: OrderEventWithRelations, b: OrderEventWithRelations) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setEvents(sortedEvents as OrderEventWithRelations[]);
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
