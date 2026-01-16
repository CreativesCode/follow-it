"use client";

import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/lib/hooks/useUserRole";
import { generateOrderCode } from "@/lib/utils/orderCode";
import { createOrderSchema, orderFiltersSchema } from "@/lib/validations/order";
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
      const supabase = createClient();
      const currentFilters = filtersStateRef.current;

      // Obtener usuario y rol
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No autorizado");
      }

      // Obtener rol del usuario
      const { data: businessMember } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      const { data: courier } = await supabase
        .from("couriers")
        .select("id, business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!businessMember && !courier) {
        throw new Error("No autorizado");
      }

      // Query base - RLS manejará los permisos
      let query = supabase
        .from("orders")
        .select(
          `
          *,
          courier:couriers!assigned_courier_id(id, display_name, phone),
          customer:customers(id, name, phone)
        `,
          { count: "exact" }
        );

      // Si es business member, filtrar por business_id
      if (businessMember) {
        query = query.eq("business_id", businessMember.business_id);
      }
      // Si es courier, RLS automáticamente filtra por assigned_courier_id

      query = query.order("updated_at", { ascending: false });

      // Aplicar filtros
      if (currentFilters.status && currentFilters.status !== "all") {
        query = query.eq("status", currentFilters.status);
      }
      if (currentFilters.courier_id && currentFilters.courier_id !== "all") {
        query = query.eq("assigned_courier_id", currentFilters.courier_id);
      }
      if (currentFilters.date_from) {
        query = query.gte("created_at", currentFilters.date_from);
      }
      if (currentFilters.date_to) {
        query = query.lte("created_at", currentFilters.date_to);
      }
      if (currentFilters.search) {
        query = query.or(
          `code.ilike.%${currentFilters.search}%,dropoff_address.ilike.%${currentFilters.search}%`
        );
      }

      // Paginación
      const from = (currentPage - 1) * currentLimit;
      const to = from + currentLimit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setOrders((data || []) as OrderWithRelations[]);
      // Actualizar paginación
      setPagination((prev) => {
        const total = count || 0;
        const totalPages = Math.ceil(total / currentLimit);
        const newPagination = {
          page: currentPage,
          limit: currentLimit,
          total,
          totalPages,
        };
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
        const supabase = createClient();

        // Validar datos con Zod
        const validatedData = createOrderSchema.parse(data);

        // Obtener usuario autenticado
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          return { error: "No autorizado" };
        }

        // Verificar que es business member
        const { data: businessMember, error: memberError } = await supabase
          .from("business_members")
          .select("business_id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (memberError || !businessMember) {
          return { error: "Solo los miembros del negocio pueden crear pedidos" };
        }

        // Generar código único
        const code = await generateOrderCode(supabase, businessMember.business_id);

        // Crear cliente si se proporcionó info
        let customer_id = null;
        if (validatedData.customer_name || validatedData.customer_phone) {
          const { data: customer, error: customerError } = await supabase
            .from("customers")
            .insert({
              business_id: businessMember.business_id,
              name: validatedData.customer_name,
              phone: validatedData.customer_phone,
            })
            .select("id")
            .single();

          if (!customerError && customer) {
            customer_id = customer.id;
          }
        }

        // Crear pedido
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            business_id: businessMember.business_id,
            code,
            customer_id,
            dropoff_address: validatedData.dropoff_address,
            pickup_address: validatedData.pickup_address,
            dropoff_lat: validatedData.dropoff_lat,
            dropoff_lng: validatedData.dropoff_lng,
            items_summary: validatedData.items_summary,
            notes: validatedData.notes,
            amount_cents: validatedData.amount_cents,
            status: "pending",
            created_by: user.id,
          })
          .select(
            `
            *,
            courier:couriers!assigned_courier_id(id, display_name, phone),
            customer:customers(id, name, phone)
          `
          )
          .single();

        if (orderError) {
          throw orderError;
        }

        // Crear evento inicial
        await supabase.from("order_events").insert({
          business_id: businessMember.business_id,
          order_id: order.id,
          type: "order_created",
          to_status: "pending",
          created_by: user.id,
        });

        // Nota: Las notificaciones se pueden crear con un trigger en la base de datos
        // o usando una Edge Function. Por ahora, las omitimos aquí para simplificar.

        // Si Realtime está habilitado, no necesitamos refetch manual
        // Pero lo hacemos por si acaso (mejor tener los datos actualizados)
        if (!shouldEnableRealtime) {
          await fetchOrdersRef.current();
        }
        return { order: order as OrderWithRelations };
      } catch (err) {
        console.error("Error creating order:", err);

        // Manejar errores de validación de Zod
        if (
          err &&
          typeof err === "object" &&
          "name" in err &&
          err.name === "ZodError"
        ) {
          const zodError = err as {
            issues?: Array<{ path: (string | number)[]; message: string }>;
          };
          const details =
            zodError.issues?.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })) || [];
          return {
            error: `Datos inválidos: ${details.map((d) => d.message).join(", ")}`,
          };
        }

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
