"use client";

import { Cloud, Loader2, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  pendingCount?: number;
  isSyncing?: boolean;
};

export function OfflineIndicator({
  pendingCount = 0,
  isSyncing = false,
}: Props) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // No mostrar si está online y no hay pendientes
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div
      className={`
        fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto
        px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50
        safe-area-bottom
        ${isOnline ? "bg-blue-500 text-white" : "bg-gray-800 text-white"}
      `}
      style={{
        marginBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">Sin conexión</span>
          {pendingCount > 0 && (
            <span className="text-sm opacity-80">
              ({pendingCount} pendiente{pendingCount !== 1 ? "s" : ""})
            </span>
          )}
        </>
      ) : isSyncing ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium">Sincronizando...</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <Cloud className="w-5 h-5" />
          <span className="font-medium">
            {pendingCount} cambio{pendingCount !== 1 ? "s" : ""} pendiente
            {pendingCount !== 1 ? "s" : ""}
          </span>
        </>
      ) : null}
    </div>
  );
}
