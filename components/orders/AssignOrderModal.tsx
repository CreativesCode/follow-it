"use client";

import { CourierSelect } from "@/components/couriers/CourierSelect";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { OrderWithRelations } from "@/types/orders";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type Props = {
  order: OrderWithRelations;
  businessId: string;
  onClose: () => void;
  onSuccess: () => void;
};

type AssignFormInput = {
  courier_id: string | null | undefined;
};

export function AssignOrderModal({
  order,
  businessId,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { businessMember, user } = useAuth();

  // Memoizar el cliente de Supabase
  const supabase = useMemo(() => createClient(), []);

  const isAssigned = order.status === "assigned";

  // Schema adaptado para el formulario (solo courier_id, opcional si ya está asignado)
  const formSchema = z.object({
    courier_id: isAssigned
      ? z.string().uuid("ID de mensajero inválido").optional().nullable()
      : z.string().uuid("ID de mensajero inválido"),
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignFormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courier_id: order.assigned_courier_id || "",
    },
  });

  const courierId = watch("courier_id");
  const hasChanged = courierId !== (order.assigned_courier_id || "");

  const onSubmit = async (data: AssignFormInput) => {
    if (!data.courier_id && !isAssigned) {
      setError("Selecciona un mensajero");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Usar businessMember del contexto si está disponible
      let effectiveBusinessMember = businessMember;

      // Asegurar que tenemos el usuario
      let effectiveUser = user;
      if (!effectiveUser) {
        const {
          data: { user: fetchedUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !fetchedUser) {
          throw new Error("No autorizado");
        }
        effectiveUser = fetchedUser;
      }

      if (!effectiveBusinessMember) {
        // Solo consultar si no tenemos datos del contexto
        const { data: bm, error: memberError } = await supabase
          .from("business_members")
          .select("business_id, user_id, role, is_active, created_at")
          .eq("user_id", effectiveUser.id)
          .eq("is_active", true)
          .maybeSingle();

        if (memberError || !bm) {
          throw new Error(
            "Solo los miembros del negocio pueden asignar pedidos"
          );
        }

        effectiveBusinessMember = bm ?? undefined;
      }

      // Si se quiere desasignar
      if (!data.courier_id && isAssigned) {
        // Verificar que el pedido existe y pertenece al negocio
        const { data: existingOrder, error: checkError } = await supabase
          .from("orders")
          .select("id, status, business_id")
          .eq("id", order.id)
          .eq("business_id", effectiveBusinessMember.business_id)
          .single();

        if (checkError || !existingOrder) {
          throw new Error("Pedido no encontrado");
        }

        // Desasignar
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            assigned_courier_id: null,
            assigned_at: null,
            status: "pending",
          })
          .eq("id", order.id);

        if (updateError) throw updateError;

        // Crear evento
        await supabase.from("order_events").insert({
          business_id: effectiveBusinessMember.business_id,
          order_id: order.id,
          type: "order_unassigned",
          from_status: existingOrder.status,
          to_status: "pending",
          created_by: effectiveUser.id,
        });
      }
      // Si se quiere asignar/reasignar
      else if (data.courier_id) {
        // Verificar que el pedido existe y está pending
        const { data: existingOrder, error: orderError } = await supabase
          .from("orders")
          .select("id, status, business_id, code, dropoff_address")
          .eq("id", order.id)
          .eq("business_id", effectiveBusinessMember.business_id)
          .single();

        if (orderError || !existingOrder) {
          throw new Error("Pedido no encontrado");
        }

        if (existingOrder.status !== "pending" && !isAssigned) {
          throw new Error(
            `No se puede asignar un pedido en estado "${existingOrder.status}"`
          );
        }

        // Verificar que el courier existe y pertenece al negocio
        const { data: courier, error: courierError } = await supabase
          .from("couriers")
          .select("id, display_name, is_active, user_id")
          .eq("id", data.courier_id)
          .eq("business_id", effectiveBusinessMember.business_id)
          .single();

        if (courierError || !courier) {
          throw new Error("Mensajero no encontrado");
        }

        if (!courier.is_active) {
          throw new Error("El mensajero no está activo");
        }

        // Si ya está asignado a otro courier, primero desasignar
        if (isAssigned && order.assigned_courier_id !== data.courier_id) {
          await supabase
            .from("orders")
            .update({
              assigned_courier_id: null,
              assigned_at: null,
            })
            .eq("id", order.id);
        }

        // Asignar nuevo
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "assigned",
            assigned_courier_id: data.courier_id,
            assigned_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        if (updateError) throw updateError;

        // Crear evento
        const orderCode = existingOrder.code || `#${order.id.slice(0, 8)}`;
        await supabase.from("order_events").insert({
          business_id: effectiveBusinessMember.business_id,
          order_id: order.id,
          type: "order_assigned",
          from_status: existingOrder.status,
          to_status: "assigned",
          courier_id: data.courier_id,
          created_by: effectiveUser.id,
          meta: { courier_name: courier.display_name },
        });

        // Crear notificación para el courier
        await supabase.from("notifications").insert({
          user_id: courier.user_id,
          title: "Nuevo pedido asignado",
          body: `Se te asignó el pedido ${orderCode}`,
          type: "order_assigned",
          data: {
            order_id: order.id,
            order_code: orderCode,
            dropoff_address: existingOrder.dropoff_address,
          },
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al asignar mensajero";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 safe-area-inset modal-container">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90dvh] overflow-hidden flex flex-col modal-content">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">
              {isAssigned ? "Cambiar Asignación" : "Asignar Mensajero"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 modal-form-content">
          {/* Info del pedido */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Pedido</p>
            <p className="font-mono font-semibold">{order.code}</p>
            <p className="text-sm text-gray-600 mt-1">
              {order.dropoff_address}
            </p>
          </div>

          {/* Selector de mensajero */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mensajero {!isAssigned && <span className="text-red-500">*</span>}
            </label>
            <CourierSelect
              businessId={businessId}
              value={courierId || null}
              onChange={(value) => setValue("courier_id", value || "")}
              showUnassignOption={isAssigned}
              placeholder="Seleccionar mensajero..."
            />
            {errors.courier_id && (
              <p className="mt-1 text-sm text-red-500">
                {errors.courier_id.message}
              </p>
            )}
          </div>

          {/* Error */}
          {error && <Alert variant="error">{error}</Alert>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={loading || !hasChanged}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isAssigned && !courierId ? "Desasignar" : "Asignar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
