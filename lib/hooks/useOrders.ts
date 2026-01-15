"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  Order,
  OrderFilters,
  OrderFormData,
  OrderWithRelations,
} from "@/types/orders";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UseOrdersReturn = {
  orders: OrderWithRelations[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: OrderFilters;
  setFilters: (filters: Partial<OrderFilters>) => void;
  refetch: () => Promise<void>;
  createOrder: (
    data: OrderFormData
  ) => Promise<{ order?: OrderWithRelations; error?: string }>;
};

type UseOrdersOptions = Partial<OrderFilters> & {
  businessId?: string; // Para habilitar Realtime
  enableRealtime?: boolean; // Por defecto true si businessId está presente
};

export function useOrders(initialFilters?: UseOrdersOptions): UseOrdersReturn {
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Extraer businessId y enableRealtime de los filtros
  const {
    businessId,
    enableRealtime = true,
    ...filters
  } = initialFilters || {};
  const shouldEnableRealtime = businessId && enableRealtime;

  const [filtersState, setFiltersState] = useState<OrderFilters>({
    status: "all",
    courier_id: "all",
    ...filters,
  });

  // Serializar filtersState para usar como dependencia estable
  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        status: filtersState.status,
        courier_id: filtersState.courier_id,
        date_from: filtersState.date_from,
        date_to: filtersState.date_to,
        search: filtersState.search,
      }),
    [
      filtersState.status,
      filtersState.courier_id,
      filtersState.date_from,
      filtersState.date_to,
      filtersState.search,
    ]
  );

  // Refs para mantener valores actuales sin recrear funciones
  const filtersStateRef = useRef(filtersState);
  const paginationRef = useRef(pagination);

  // Actualizar refs cuando cambien los valores
  useEffect(() => {
    filtersStateRef.current = filtersState;
  }, [filtersState]);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  // Ref para evitar múltiples llamadas simultáneas
  const fetchingRef = useRef(false);
  const lastFetchKeyRef = useRef<string>("");

  const fetchOrders = useCallback(async () => {
    // Crear una clave única para esta petición
    const currentFiltersKey = filtersKey;
    const currentPage = paginationRef.current.page;
    const currentLimit = paginationRef.current.limit;
    const fetchKey = `${currentFiltersKey}-${currentPage}-${currentLimit}`;

    // Si ya hay una petición en progreso para los mismos parámetros, saltar
    if (fetchingRef.current && lastFetchKeyRef.current === fetchKey) {
      console.log("Fetch already in progress for same params, skipping...");
      return;
    }

    // Prevenir llamadas múltiples simultáneas
    if (fetchingRef.current) {
      console.log("Fetch already in progress, skipping...");
      return;
    }

    lastFetchKeyRef.current = fetchKey;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const currentFilters = filtersStateRef.current;
      const params = new URLSearchParams();
      if (currentFilters.status && currentFilters.status !== "all")
        params.set("status", currentFilters.status);
      if (currentFilters.courier_id && currentFilters.courier_id !== "all")
        params.set("courier_id", currentFilters.courier_id);
      if (currentFilters.date_from)
        params.set("date_from", currentFilters.date_from);
      if (currentFilters.date_to) params.set("date_to", currentFilters.date_to);
      if (currentFilters.search) params.set("search", currentFilters.search);
      params.set("page", String(currentPage));
      params.set("limit", String(currentLimit));

      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setOrders(data.orders);
      // Solo actualizar paginación si los valores realmente cambiaron para evitar loops
      setPagination((prev) => {
        const newPagination = data.pagination;
        if (
          prev.page === newPagination.page &&
          prev.limit === newPagination.limit &&
          prev.total === newPagination.total &&
          prev.totalPages === newPagination.totalPages
        ) {
          return prev; // No cambiar si los valores son iguales
        }
        return newPagination;
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al obtener pedidos";
      setError(errorMessage);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [filtersKey]); // Solo depende de filtersKey, los demás valores vienen de refs

  // Ref para mantener referencia estable a fetchOrders para realtime
  const fetchOrdersRef = useRef(fetchOrders);
  useEffect(() => {
    fetchOrdersRef.current = fetchOrders;
  }, [fetchOrders]);

  // Set up Realtime subscription
  useEffect(() => {
    if (!shouldEnableRealtime || !businessId) return;

    let mounted = true;
    const supabase = createClient();

    const setupRealtime = () => {
      console.log(`Setting up orders realtime for business: ${businessId}`);

      // Clean up any existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Set up realtime subscription for orders
      const channel = supabase
        .channel(`orders:${businessId}`)
        .on<Order>(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "orders",
            filter: `business_id=eq.${businessId}`,
          },
          (payload: RealtimePostgresChangesPayload<Order>) => {
            if (!mounted) return;
            console.log("New order received via realtime:", payload.new);

            // Actualizar lista - hacer refetch completo para respetar filtros y paginación
            fetchOrdersRef.current();
          }
        )
        .on<Order>(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `business_id=eq.${businessId}`,
          },
          (payload: RealtimePostgresChangesPayload<Order>) => {
            if (!mounted) return;
            if (!payload.new) return;
            const updatedOrderData = payload.new as Order;
            console.log("Order updated via realtime:", updatedOrderData);

            // Actualizar orden específica en el estado local
            setOrders((prev) => {
              const index = prev.findIndex((o) => o.id === updatedOrderData.id);

              // Si la orden no está en la lista actual (puede ser por paginación/filtros)
              if (index === -1) {
                // Hacer refetch para verificar si ahora debe aparecer
                fetchOrdersRef.current();
                return prev;
              }

              // Verificar si la orden actualizada sigue cumpliendo los filtros
              const updatedOrder = {
                ...prev[index],
                ...updatedOrderData,
              } as OrderWithRelations;

              // Si los filtros excluyen esta orden, removerla de la lista
              const currentFilters = filtersStateRef.current;
              if (
                currentFilters.status &&
                currentFilters.status !== "all" &&
                updatedOrder.status !== currentFilters.status
              ) {
                return prev.filter((o) => o.id !== updatedOrder.id);
              }

              // Actualizar la orden en su posición
              const newOrders = [...prev];
              newOrders[index] = updatedOrder;
              return newOrders;
            });
          }
        )
        .on<Order>(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "orders",
            filter: `business_id=eq.${businessId}`,
          },
          (payload: RealtimePostgresChangesPayload<Order>) => {
            if (!mounted) return;
            if (!payload.old) return;
            const deletedOrder = payload.old as Order;
            console.log("Order deleted via realtime:", deletedOrder);

            // Remover orden de la lista
            setOrders((prev) => prev.filter((o) => o.id !== deletedOrder.id));
          }
        )
        .subscribe((status) => {
          if (!mounted) return;
          console.log(`Orders realtime subscription status: ${status}`);
          if (status === "SUBSCRIBED") {
            console.log("✅ Successfully subscribed to orders realtime");
            setError(null);
          } else if (status === "CHANNEL_ERROR") {
            console.error("❌ Error subscribing to orders realtime");
            setError("Error al conectar con actualizaciones en tiempo real");
          } else if (status === "TIMED_OUT") {
            console.warn("⏱️ Timeout subscribing to orders realtime");
            setError("Timeout al conectar con actualizaciones en tiempo real");
          }
        });

      if (mounted) {
        channelRef.current = channel;
      } else {
        supabase.removeChannel(channel);
      }
    };

    setupRealtime();

    return () => {
      mounted = false;
      if (channelRef.current) {
        console.log("Cleaning up orders channel");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [businessId, shouldEnableRealtime]);

  // Ejecutar fetchOrders cuando cambien los filtros o la paginación
  // Usamos filtersKey en lugar de filtersState para evitar loops por cambio de referencia
  useEffect(() => {
    // Usar fetchOrdersRef.current para evitar dependencia de la función
    fetchOrdersRef.current();
  }, [filtersKey, pagination.page, pagination.limit]);

  const setFilters = useCallback((newFilters: Partial<OrderFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset page on filter change
  }, []);

  const createOrder = useCallback(
    async (data: OrderFormData) => {
      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          return { error: result.error || "Error al crear pedido" };
        }

        // Si Realtime está habilitado, no necesitamos refetch manual
        // Pero lo hacemos por si acaso (mejor tener los datos actualizados)
        if (!shouldEnableRealtime) {
          await fetchOrdersRef.current();
        }
        return { order: result.order as OrderWithRelations };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al crear pedido";
        return { error: errorMessage };
      }
    },
    [shouldEnableRealtime]
  );

  return {
    orders,
    loading,
    error,
    pagination,
    filters: filtersState,
    setFilters,
    refetch: fetchOrders,
    createOrder,
  };
}
