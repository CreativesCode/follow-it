"use client";

import { createClient } from "@/lib/supabase/client";
import type { CourierWithLocation } from "@/types/location";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

type UseRealtimeLocationsReturn = {
  couriers: CourierWithLocation[];
  loading: boolean;
  error: string | null;
};

export function useRealtimeLocations(
  businessId: string
): UseRealtimeLocationsReturn {
  const [couriers, setCouriers] = useState<CourierWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch inicial
  const fetchCouriersWithLocations = useCallback(async () => {
    try {
      const supabase = createClient();

      // Obtener mensajeros activos
      const { data: couriersData, error: couriersError } = await supabase
        .from("couriers")
        .select("id, display_name, phone, is_active")
        .eq("business_id", businessId)
        .eq("is_active", true);

      if (couriersError) throw couriersError;

      // Obtener última ubicación de cada uno
      const couriersWithLocations: CourierWithLocation[] = await Promise.all(
        (couriersData || []).map(async (courier) => {
          // Última ubicación
          const { data: locationData } = await supabase
            .from("courier_locations")
            .select("lat, lng, recorded_at, accuracy_m")
            .eq("courier_id", courier.id)
            .order("recorded_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Pedidos activos
          const { count } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("assigned_courier_id", courier.id)
            .in("status", ["assigned", "en_route"]);

          return {
            ...courier,
            last_location: locationData
              ? {
                  lat: locationData.lat,
                  lng: locationData.lng,
                  recorded_at: locationData.recorded_at,
                  accuracy_m: locationData.accuracy_m ?? undefined,
                }
              : null,
            active_orders_count: count || 0,
          };
        })
      );

      setCouriers(couriersWithLocations);
      setError(null);
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "Error al cargar mensajeros";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  // Setup inicial + realtime
  useEffect(() => {
    fetchCouriersWithLocations();

    const supabase = createClient();

    // Suscribirse a cambios en courier_locations
    const channel = supabase
      .channel("courier-locations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "courier_locations",
          filter: `business_id=eq.${businessId}`,
        },
        (
          payload: RealtimePostgresChangesPayload<{
            courier_id: string;
            lat: number;
            lng: number;
            recorded_at: string;
            accuracy_m: number | null;
          }>
        ) => {
          const newLocation = payload.new;

          if (
            !newLocation ||
            typeof newLocation !== "object" ||
            !("courier_id" in newLocation) ||
            !("lat" in newLocation) ||
            !("lng" in newLocation) ||
            !("recorded_at" in newLocation)
          ) {
            return;
          }

          const location = newLocation as {
            courier_id: string;
            lat: number;
            lng: number;
            recorded_at: string;
            accuracy_m: number | null;
          };

          // Actualizar ubicación del courier
          setCouriers((prev) =>
            prev.map((courier) => {
              if (courier.id === location.courier_id) {
                return {
                  ...courier,
                  last_location: {
                    lat: location.lat,
                    lng: location.lng,
                    recorded_at: location.recorded_at,
                    accuracy_m: location.accuracy_m ?? undefined,
                  },
                };
              }
              return courier;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, fetchCouriersWithLocations]);

  return {
    couriers,
    loading,
    error,
  };
}
