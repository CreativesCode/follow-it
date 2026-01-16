"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { updateOrderSchema } from "@/lib/validations/order";
import type { OrderWithRelations } from "@/types/orders";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseOrderReturn = {
  order: OrderWithRelations | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateOrder: (data: any) => Promise<{ order?: any; error?: string }>;
};

export function useOrder(orderId: string): UseOrderReturn {
  const [order, setOrder] = useState<OrderWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { businessMember, courier } = useAuth();

  // Memoizar el cliente de Supabase
  const supabase = useMemo(() => createClient(), []);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Usar businessMember/courier del contexto si está disponible, sino consultar
      let effectiveBusinessMember = businessMember;
      let effectiveCourier = courier;

      if (!effectiveBusinessMember && !effectiveCourier) {
        // Solo consultar si no tenemos datos del contexto
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("No autorizado");
        }

        const { data: bm } = await supabase
          .from("business_members")
          .select("business_id, user_id, role, is_active, created_at")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        const { data: c } = await supabase
          .from("couriers")
          .select(
            "id, business_id, user_id, display_name, phone, is_active, created_at"
          )
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (!bm && !c) {
          throw new Error("No autorizado");
        }

        effectiveBusinessMember = bm ?? undefined;
        effectiveCourier = c ?? undefined;
      }

      // Decodificar el orderId si viene de URL
      const decodedOrderId = decodeURIComponent(orderId);

      // Query base - RLS manejará los permisos
      let query = supabase.from("orders").select(
        `
        *,
        courier:couriers!assigned_courier_id(id, display_name, phone),
        customer:customers(id, name, phone)
      `
      );

      // Buscar por ID (UUID) o por código
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          decodedOrderId
        );

      if (isUUID) {
        query = query.eq("id", decodedOrderId);
      } else {
        // Asegurar que el código tenga el # al inicio
        const codeToSearch = decodedOrderId.startsWith("#")
          ? decodedOrderId
          : `#${decodedOrderId}`;
        query = query.eq("code", codeToSearch);
      }

      // Si es business member, filtrar por business_id
      if (effectiveBusinessMember) {
        query = query.eq("business_id", effectiveBusinessMember.business_id);
      }
      // Si es courier, RLS automáticamente filtra por assigned_courier_id

      const { data: order, error } = await query.single();

      if (error || !order) {
        throw new Error("Pedido no encontrado");
      }

      setOrder(order as OrderWithRelations);
    } catch (err: any) {
      setError(err.message || "Error al obtener pedido");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder]);

  const updateOrder = useCallback(
    async (data: any) => {
      try {
        // Validar datos con Zod
        const validatedData = updateOrderSchema.parse(data);

        // Usar businessMember del contexto si está disponible
        let effectiveBusinessMember = businessMember;

        if (!effectiveBusinessMember) {
          // Obtener usuario autenticado
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            return { error: "No autorizado" };
          }

          // Verificar que es business member
          const { data: bm, error: memberError } = await supabase
            .from("business_members")
            .select("business_id, user_id, role, is_active, created_at")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .maybeSingle();

          if (memberError || !bm) {
            return {
              error: "Solo los miembros del negocio pueden actualizar pedidos",
            };
          }

          effectiveBusinessMember = bm ?? undefined;
        }

        if (!effectiveBusinessMember) {
          return {
            error: "Solo los miembros del negocio pueden actualizar pedidos",
          };
        }

        const decodedOrderId = decodeURIComponent(orderId);

        // Verificar que el pedido existe y pertenece al negocio
        const { data: existingOrder, error: checkError } = await supabase
          .from("orders")
          .select("id, business_id, status, customer_id")
          .eq("id", decodedOrderId)
          .eq("business_id", effectiveBusinessMember.business_id)
          .single();

        if (checkError || !existingOrder) {
          return { error: "Pedido no encontrado" };
        }

        // Solo permitir editar pedidos que no estén entregados o cancelados
        if (["delivered", "canceled"].includes(existingOrder.status)) {
          return {
            error: "No se puede editar un pedido entregado o cancelado",
          };
        }

        // Actualizar cliente si se proporcionó info
        const existingCustomerId = existingOrder.customer_id;
        let customer_id = existingCustomerId || null;
        if (validatedData.customer_name || validatedData.customer_phone) {
          // Buscar cliente existente o crear uno nuevo
          if (existingCustomerId) {
            // Actualizar cliente existente
            await supabase
              .from("customers")
              .update({
                name: validatedData.customer_name || null,
                phone: validatedData.customer_phone || null,
              })
              .eq("id", existingCustomerId);
          } else {
            // Crear nuevo cliente
            const { data: customer, error: customerError } = await supabase
              .from("customers")
              .insert({
                business_id: effectiveBusinessMember.business_id,
                name: validatedData.customer_name,
                phone: validatedData.customer_phone,
              })
              .select("id")
              .single();

            if (!customerError && customer) {
              customer_id = customer.id;
            }
          }
        }

        // Actualizar pedido
        const { data: order, error: updateError } = await supabase
          .from("orders")
          .update({
            dropoff_address: validatedData.dropoff_address,
            pickup_address: validatedData.pickup_address,
            dropoff_lat: validatedData.dropoff_lat,
            dropoff_lng: validatedData.dropoff_lng,
            items_summary: validatedData.items_summary,
            notes: validatedData.notes,
            amount_cents: validatedData.amount_cents,
            customer_id,
          })
          .eq("id", decodedOrderId)
          .select(
            `
            *,
            courier:couriers!assigned_courier_id(id, display_name, phone),
            customer:customers(id, name, phone)
          `
          )
          .single();

        if (updateError) {
          throw updateError;
        }

        // Actualizar estado local
        setOrder(order as OrderWithRelations);
        return { order: order as OrderWithRelations };
      } catch (err: any) {
        console.error("Error updating order:", err);

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
            error: `Datos inválidos: ${details
              .map((d) => d.message)
              .join(", ")}`,
          };
        }

        const errorMessage =
          err instanceof Error ? err.message : "Error al actualizar pedido";
        return { error: errorMessage };
      }
    },
    [orderId, supabase, businessMember, courier]
  );

  return {
    order,
    loading,
    error,
    refetch: fetchOrder,
    updateOrder,
  };
}
