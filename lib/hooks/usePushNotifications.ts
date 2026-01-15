// lib/hooks/usePushNotifications.ts
// Hook para manejar notificaciones push en el frontend con Capacitor

import { createClient } from "@/lib/supabase/client";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { useCallback, useEffect, useState } from "react";

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isRegistered: boolean;
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  token: string | null;
  error: string | null;
}

/**
 * Hook para manejar notificaciones push con Capacitor
 * Registra el dispositivo y maneja los tokens de notificación
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Detectar si las notificaciones push están soportadas
  useEffect(() => {
    const checkSupport = async () => {
      if (!Capacitor.isNativePlatform()) {
        // En web, las notificaciones push se manejan diferente
        setIsSupported(false);
        return;
      }

      try {
        const status = await PushNotifications.checkPermissions();
        setIsSupported(
          status.receive === "granted" || status.receive === "prompt"
        );
      } catch (err) {
        console.error("Error checking push notification permissions:", err);
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  // Registrar dispositivo para notificaciones push
  const register = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setError(
        "Las notificaciones push solo están disponibles en dispositivos nativos"
      );
      return;
    }

    try {
      setError(null);

      // Solicitar permisos
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === "prompt") {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== "granted") {
        setError("Permisos de notificaciones denegados");
        return;
      }

      // Registrar para recibir notificaciones
      await PushNotifications.register();

      // Escuchar cuando se recibe el token
      PushNotifications.addListener("registration", async (tokenResult) => {
        const deviceToken = tokenResult.value;
        setToken(deviceToken);
        setIsRegistered(true);

        // Determinar plataforma
        const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";

        // Registrar token en el backend
        try {
          const response = await fetch("/api/notifications/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: deviceToken,
              platform,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Error registering device token:", errorData);
            setError("Error al registrar token de dispositivo");
          } else {
            console.log("Device token registered successfully");
          }
        } catch (err) {
          console.error("Error registering device token:", err);
          setError("Error al registrar token de dispositivo");
        }
      });

      // Escuchar errores de registro
      PushNotifications.addListener("registrationError", (error) => {
        console.error("Error en registro de notificaciones:", error);
        setError(error.error || "Error al registrar notificaciones");
      });

      // Escuchar notificaciones recibidas
      PushNotifications.addListener(
        "pushNotificationReceived",
        (notification) => {
          console.log("Notificación recibida:", notification);
          // Aquí puedes manejar la notificación cuando la app está en primer plano
          // Por ejemplo, mostrar un toast o actualizar el estado
        }
      );

      // Escuchar cuando se hace clic en una notificación
      PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (notification) => {
          console.log("Acción de notificación:", notification);
          // Aquí puedes navegar a la pantalla relevante
          // Por ejemplo, si es una asignación de pedido, navegar a la lista de pedidos
          const data = notification.notification.data;
          if (data?.type === "order_assigned" && data?.order_id) {
            // Navegar al pedido (implementar según tu router)
            // router.push(`/orders/${data.order_id}`);
          }
        }
      );
    } catch (err) {
      console.error("Error registering push notifications:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  }, [supabase]);

  // Desregistrar dispositivo
  const unregister = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      if (token) {
        // Desregistrar token en el backend
        await fetch("/api/notifications/register", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      }

      // Remover listeners
      await PushNotifications.removeAllListeners();
      setToken(null);
      setIsRegistered(false);
    } catch (err) {
      console.error("Error unregistering push notifications:", err);
      setError(err instanceof Error ? err.message : "Error al desregistrar");
    }
  }, [token]);

  // Auto-registrar cuando el componente se monta (si está soportado)
  useEffect(() => {
    if (isSupported && !isRegistered) {
      register();
    }

    // Cleanup al desmontar
    return () => {
      // No desregistrar automáticamente, solo limpiar listeners si es necesario
    };
  }, [isSupported, isRegistered, register]);

  return {
    isSupported,
    isRegistered,
    register,
    unregister,
    token,
    error,
  };
}
