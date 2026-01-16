"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

type Courier = {
  id: string;
  user_id: string;
  business_id: string;
  display_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  // Stats calculados
  active_orders_count?: number;
  delivered_today_count?: number;
};

type UseCouriersReturn = {
  couriers: Courier[];
  activeCouriers: Courier[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useCouriers(businessId: string): UseCouriersReturn {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoizar el cliente de Supabase
  const supabase = useMemo(() => createClient(), []);

  const fetchCouriers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {

      // Obtener mensajeros
      const { data, error: fetchError } = await supabase
        .from("couriers")
        .select("*")
        .eq("business_id", businessId)
        .order("display_name");

      if (fetchError) throw fetchError;

      // Obtener conteo de pedidos activos para cada mensajero
      const couriersWithStats = await Promise.all(
        (data || []).map(async (courier) => {
          // Contar pedidos activos
          const { count } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("assigned_courier_id", courier.id)
            .in("status", ["assigned", "en_route"]);

          return {
            ...courier,
            active_orders_count: count || 0,
          };
        })
      );

      setCouriers(couriersWithStats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [businessId, supabase]);

  useEffect(() => {
    fetchCouriers();
  }, [fetchCouriers]);

  const activeCouriers = couriers.filter((c) => c.is_active);

  return {
    couriers,
    activeCouriers,
    loading,
    error,
    refetch: fetchCouriers,
  };
}
