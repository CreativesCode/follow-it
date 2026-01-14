"use client";

import type { OrderWithRelations } from "@/types/orders";
import { useCallback, useEffect, useState } from "react";

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

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setOrder(data.order);
    } catch (err: any) {
      setError(err.message);
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
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          return { error: result.error || "Error al actualizar pedido" };
        }

        // Actualizar estado local
        setOrder(result.order);
        return { order: result.order };
      } catch (err: any) {
        return { error: err.message };
      }
    },
    [orderId]
  );

  return {
    order,
    loading,
    error,
    refetch: fetchOrder,
    updateOrder,
  };
}
