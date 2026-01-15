"use client";

import { PublicOrderTimeline } from "@/components/orders/PublicOrderTimeline";
import { ORDER_STATUS_CONFIG } from "@/types/orders";
import {
  AlertCircle,
  Ban,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// Mapeo de nombres de iconos a componentes reales
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock,
  User,
  Truck,
  CheckCircle,
  XCircle,
  Ban,
  Package,
  AlertCircle,
};

type TrackingSnapshot = {
  order: {
    id: string;
    status: string;
    code: string | null;
    dropoff_address: string | null;
    updated_at: string;
  };
  courier?: {
    lat: number;
    lng: number;
    recorded_at: string;
    accuracy_m?: number;
  } | null;
};

type Props = {
  token: string;
};

export function TrackingPageClient({ token }: Props) {
  const [snapshot, setSnapshot] = useState<TrackingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchSnapshot = useCallback(async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !anonKey) {
        throw new Error("Configuración de Supabase faltante");
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/get_tracking_snapshot?token=${token}`,
        {
          headers: {
            Authorization: `Bearer ${anonKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener tracking");
      }

      setSnapshot(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch inicial
  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  // Polling cada 15 segundos
  useEffect(() => {
    const interval = setInterval(fetchSnapshot, 15000);
    return () => clearInterval(interval);
  }, [fetchSnapshot]);

  // Formatear tiempo relativo
  const formatRelativeTime = (date: string): string => {
    const now = new Date();
    const eventDate = new Date(date);
    const diffMs = now.getTime() - eventDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Hace unos segundos";
    if (diffMins < 60)
      return `Hace ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
    if (diffHours < 24)
      return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
    return `Hace ${Math.floor(diffMs / 86400000)} día${
      Math.floor(diffMs / 86400000) > 1 ? "s" : ""
    }`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando seguimiento...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Link Inválido
          </h1>
          <p className="text-gray-600 mb-4">
            {error || "El link de seguimiento no es válido o ha expirado."}
          </p>
        </div>
      </div>
    );
  }

  const statusConfig =
    ORDER_STATUS_CONFIG[
      snapshot.order.status as keyof typeof ORDER_STATUS_CONFIG
    ] || ORDER_STATUS_CONFIG.pending;
  const StatusIcon = ICON_MAP[statusConfig.icon] || Clock;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <img
              src="/logo_horizontal.svg"
              alt="Follow It"
              className="h-8 w-auto inline-block"
            />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Seguimiento de Pedido
              </h1>
              {snapshot.order.code && (
                <p className="text-sm text-gray-500 font-mono">
                  {snapshot.order.code}
                </p>
              )}
            </div>
            <button
              onClick={fetchSnapshot}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`w-14 h-14 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}
            >
              <StatusIcon className={`w-7 h-7 ${statusConfig.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Estado actual</p>
              <p className={`text-xl font-semibold ${statusConfig.color}`}>
                {statusConfig.label}
              </p>
            </div>
          </div>

          {/* Timeline visual */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {["pending", "assigned", "en_route", "delivered"].map(
                (step, index) => {
                  const stepConfig =
                    ORDER_STATUS_CONFIG[
                      step as keyof typeof ORDER_STATUS_CONFIG
                    ] || ORDER_STATUS_CONFIG.pending;
                  const StepIcon = ICON_MAP[stepConfig.icon] || Clock;

                  // Determinar qué estados están completados
                  // Un estado está completado si el estado actual es posterior o igual
                  const statusOrder = [
                    "pending",
                    "assigned",
                    "en_route",
                    "delivered",
                  ];

                  // Si el estado actual no está en el flujo normal (ej: failed, canceled),
                  // no colorear ningún paso como completado
                  const currentStatusIndex = statusOrder.indexOf(
                    snapshot.order.status
                  );
                  const stepIndex = statusOrder.indexOf(step);

                  // Un paso está completado si:
                  // 1. El estado actual está en el flujo normal (index >= 0)
                  // 2. El estado actual es igual o posterior al paso actual
                  const isCompleted =
                    currentStatusIndex >= 0 && currentStatusIndex >= stepIndex;
                  const isCurrent = step === snapshot.order.status;

                  return (
                    <div
                      key={step}
                      className="flex flex-col items-center relative flex-1"
                    >
                      {/* Line */}
                      {index > 0 && (
                        <div
                          className={`absolute right-1/2 top-4 w-full h-0.5 -translate-y-1/2 ${
                            isCompleted ? "bg-blue-500" : "bg-gray-200"
                          }`}
                          style={{
                            width: "calc(100% - 2rem)",
                            right: "50%",
                            transform: "translateX(50%)",
                          }}
                        />
                      )}

                      {/* Icon */}
                      <div
                        className={`
                        relative z-10 w-8 h-8 rounded-full flex items-center justify-center
                        ${
                          isCurrent
                            ? "bg-blue-500 text-white ring-4 ring-blue-100"
                            : isCompleted
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-400"
                        }
                      `}
                      >
                        <StepIcon className="w-4 h-4" />
                      </div>

                      {/* Label */}
                      <span
                        className={`text-xs mt-2 text-center ${
                          isCompleted
                            ? "text-gray-900 font-medium"
                            : "text-gray-400"
                        }`}
                      >
                        {stepConfig.label}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        {snapshot.order.dropoff_address && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Dirección de entrega
                </p>
                <p className="text-gray-900">
                  {snapshot.order.dropoff_address}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Map (si hay ubicación del mensajero y está en camino) */}
        {snapshot.courier && snapshot.order.status === "en_route" && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <p className="text-sm text-gray-500">Ubicación del mensajero</p>
              <p className="text-xs text-gray-400 mt-1">
                Actualizado {formatRelativeTime(snapshot.courier.recorded_at)}
              </p>
            </div>
            {/* Placeholder para mapa - integrar con Mapbox/Google Maps */}
            <div className="h-48 bg-gray-100 flex items-center justify-center">
              <a
                href={`https://maps.google.com/?q=${snapshot.courier.lat},${snapshot.courier.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-sm"
              >
                Ver en Google Maps
              </a>
            </div>
          </div>
        )}

        {/* Timeline de eventos */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-md font-semibold text-gray-900 mb-4">
            Historial de Eventos
          </h2>
          <PublicOrderTimeline token={token} />
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <p className="text-center text-xs text-gray-400">
            Última actualización: {formatRelativeTime(lastUpdate.toISOString())}
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400">
        <div className="flex justify-center items-center space-x-2">
          <img
            src="/logo_horizontal.svg"
            alt="Follow It"
            className="h-8 w-auto inline-block"
          />
        </div>
      </footer>
    </div>
  );
}
