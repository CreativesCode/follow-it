"use client";

import { MapPin, WifiOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";

type Props = {
  isTracking: boolean;
  lastLocation: { lat: number; lng: number } | null;
  error: string | null;
  offlineQueueSize: number;
};

export function CourierTrackingIndicator({
  isTracking,
  lastLocation,
  error,
  offlineQueueSize,
}: Props) {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-900">Error de Tracking</p>
          <p className="text-xs text-red-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!isTracking) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4 flex items-center gap-3">
        <MapPin className="w-5 h-5 text-gray-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">
            Tracking Inactivo
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            No tienes pedidos activos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <div className="relative">
            <MapPin className="w-5 h-5 text-green-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-green-900">
              Tracking Activo
            </p>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          {lastLocation && (
            <p className="text-xs text-green-700 mt-1">
              📍 {lastLocation.lat.toFixed(6)}, {lastLocation.lng.toFixed(6)}
            </p>
          )}
          {offlineQueueSize > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
              <WifiOff className="w-3 h-3" />
              <span>
                {offlineQueueSize} ubicación{offlineQueueSize !== 1 ? "es" : ""}{" "}
                pendiente{offlineQueueSize !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
