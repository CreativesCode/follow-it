"use client";

import type { LocationPing } from "@/types/location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TrackingConfig = {
  intervalMs: number; // Intervalo mínimo entre pings (default: 30000)
  minDistanceM: number; // Distancia mínima para nuevo ping (default: 50)
  maxQueueSize: number; // Máximo pings en cola offline (default: 50)
};

type UseLocationTrackingReturn = {
  isTracking: boolean;
  lastLocation: LocationPing | null;
  error: string | null;
  offlineQueueSize: number;
  startTracking: () => void;
  stopTracking: () => void;
};

const DEFAULT_CONFIG: TrackingConfig = {
  intervalMs: 30000, // 30 segundos
  minDistanceM: 50, // 50 metros
  maxQueueSize: 50,
};

// Calcular distancia entre dos puntos (Haversine)
function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Detectar si estamos en Capacitor (mobile)
function isCapacitor(): boolean {
  return typeof window !== "undefined" && "Capacitor" in window;
}

// Obtener posición usando Capacitor o Web API
async function getCurrentPosition(): Promise<GeolocationPosition> {
  if (isCapacitor()) {
    // Usar Capacitor Geolocation (mejor para mobile)
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 10000,
      });

      // Convertir a formato estándar GeolocationPosition
      return {
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? 0,
          altitude: position.coords.altitude ?? null,
          altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
          heading: position.coords.heading ?? null,
          speed: position.coords.speed ?? null,
        },
        timestamp: position.timestamp,
      } as GeolocationPosition;
    } catch (err) {
      console.warn(
        "Capacitor Geolocation failed, falling back to web API:",
        err
      );
      // Fallback a web API
    }
  }

  // Web API fallback
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalización no soportada"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 10000,
    });
  });
}

// Watch position usando Capacitor o Web API
function watchPosition(
  onSuccess: (position: GeolocationPosition) => void,
  onError: (error: GeolocationPositionError) => void,
  options: PositionOptions
): number | null {
  if (isCapacitor()) {
    // Usar Capacitor Geolocation
    import("@capacitor/geolocation")
      .then(({ Geolocation }) => {
        Geolocation.watchPosition(
          {
            enableHighAccuracy: options.enableHighAccuracy ?? true,
            timeout: options.timeout ?? 30000,
            maximumAge: options.maximumAge ?? 10000,
          },
          (position, err) => {
            if (err) {
              onError({
                code: err.code ?? 0,
                message: err.message ?? "Unknown error",
                PERMISSION_DENIED: 1,
                POSITION_UNAVAILABLE: 2,
                TIMEOUT: 3,
              } as GeolocationPositionError);
              return;
            }

            if (position) {
              const standardPosition: GeolocationPosition = {
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy ?? 0,
                  altitude: position.coords.altitude ?? null,
                  altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
                  heading: position.coords.heading ?? null,
                  speed: position.coords.speed ?? null,
                },
                timestamp: position.timestamp,
              } as GeolocationPosition;
              onSuccess(standardPosition);
            }
          }
        );
      })
      .catch((err) => {
        console.warn("Capacitor Geolocation watch failed, falling back:", err);
        // Fallback a web API
        if (navigator.geolocation) {
          return navigator.geolocation.watchPosition(
            onSuccess,
            onError,
            options
          );
        }
      });
    // Retornar un ID temporal (Capacitor no retorna ID, pero necesitamos algo)
    return Date.now();
  }

  // Web API
  if (!navigator.geolocation) {
    onError({
      code: 0,
      message: "Geolocalización no soportada",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } as GeolocationPositionError);
    return null;
  }

  return navigator.geolocation.watchPosition(onSuccess, onError, options);
}

// Clear watch usando Capacitor o Web API
function clearWatch(watchId: number | null): void {
  if (!watchId) return;

  if (isCapacitor()) {
    // Capacitor no tiene clearWatch, pero podemos ignorar
    // El watch se limpia automáticamente cuando el componente se desmonta
    return;
  }

  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

export function useLocationTracking(
  hasActiveOrders: boolean,
  config: Partial<TrackingConfig> = {}
): UseLocationTrackingReturn {
  const cfg = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(config)]
  );

  const [isTracking, setIsTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState<LocationPing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<LocationPing[]>([]);

  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ lat: number; lng: number; time: number } | null>(
    null
  );
  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Enviar ping al servidor
  const sendPing = useCallback(async (ping: LocationPing) => {
    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ping),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send location");
      }

      lastSentRef.current = {
        lat: ping.lat,
        lng: ping.lng,
        time: Date.now(),
      };

      return true;
    } catch (err) {
      console.error("Error sending location:", err);
      return false;
    }
  }, []);

  // Enviar cola offline
  const flushOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return;

    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pings: offlineQueue }),
      });

      if (response.ok) {
        setOfflineQueue([]);
      }
    } catch (err) {
      console.error("Error flushing offline queue:", err);
    }
  }, [offlineQueue]);

  // Manejar nueva posición
  const handlePosition = useCallback(
    (position: GeolocationPosition) => {
      const ping: LocationPing = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy_m: position.coords.accuracy,
        speed_mps: position.coords.speed ?? undefined,
        heading: position.coords.heading ?? undefined,
        recorded_at: new Date().toISOString(),
      };

      setLastLocation(ping);
      setError(null);

      // Verificar si debemos enviar
      const last = lastSentRef.current;
      const now = Date.now();

      let shouldSend = false;

      if (!last) {
        // Primer ping
        shouldSend = true;
      } else {
        const distance = getDistanceMeters(
          last.lat,
          last.lng,
          ping.lat,
          ping.lng
        );
        const timeDiff = now - last.time;

        // Enviar si: pasó el intervalo mínimo O se movió suficiente
        if (timeDiff >= cfg.intervalMs || distance >= cfg.minDistanceM) {
          shouldSend = true;
        }
      }

      if (shouldSend) {
        sendPing(ping).then((success) => {
          if (!success) {
            // Agregar a cola offline si no hay conexión
            if (typeof navigator !== "undefined" && !navigator.onLine) {
              setOfflineQueue((prev) => {
                const newQueue = [...prev, ping];
                // Limitar tamaño
                if (newQueue.length > cfg.maxQueueSize) {
                  return newQueue.slice(-cfg.maxQueueSize);
                }
                return newQueue;
              });
            }
          }
        });
      }
    },
    [cfg, sendPing]
  );

  // Manejar error de geolocalización
  const handleError = useCallback((err: GeolocationPositionError) => {
    console.error("Geolocation error:", err);
    setError(
      err.code === 1
        ? "Permiso de ubicación denegado"
        : err.code === 2
        ? "Ubicación no disponible"
        : "Error obteniendo ubicación"
    );
  }, []);

  // Iniciar tracking
  const startTracking = useCallback(() => {
    if (watchIdRef.current !== null) return; // Ya está activo

    // Para Capacitor, usar polling cada intervalo en lugar de watchPosition continuo
    // (más eficiente en batería)
    if (isCapacitor()) {
      // Polling optimizado para Capacitor
      const poll = async () => {
        try {
          const position = await getCurrentPosition();
          handlePosition(position);
        } catch (err) {
          handleError(err as GeolocationPositionError);
        }
      };

      // Poll inmediato
      poll();

      // Poll periódico
      watchIntervalRef.current = setInterval(poll, cfg.intervalMs);
      setIsTracking(true);
      setError(null);
      return;
    }

    // Web API: usar watchPosition
    const watchId = watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 10000,
    });

    if (watchId !== null) {
      watchIdRef.current = watchId;
      setIsTracking(true);
      setError(null);
    } else {
      setError("No se pudo iniciar el tracking");
    }
  }, [handlePosition, handleError, cfg.intervalMs]);

  // Detener tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (watchIntervalRef.current !== null) {
      clearInterval(watchIntervalRef.current);
      watchIntervalRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Auto-start/stop basado en pedidos activos
  useEffect(() => {
    if (hasActiveOrders && !isTracking) {
      startTracking();
    } else if (!hasActiveOrders && isTracking) {
      stopTracking();
    }
  }, [hasActiveOrders, isTracking, startTracking, stopTracking]);

  // Flush offline queue cuando vuelve conexión
  useEffect(() => {
    const handleOnline = () => {
      flushOfflineQueue();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      return () => window.removeEventListener("online", handleOnline);
    }
  }, [flushOfflineQueue]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        clearWatch(watchIdRef.current);
      }
      if (watchIntervalRef.current !== null) {
        clearInterval(watchIntervalRef.current);
      }
    };
  }, []);

  return {
    isTracking,
    lastLocation,
    error,
    offlineQueueSize: offlineQueue.length,
    startTracking,
    stopTracking,
  };
}
