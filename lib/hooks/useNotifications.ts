"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();

      // Obtener usuario autenticado
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("No autenticado");
      }

      // Obtener notificaciones directamente de Supabase
      const { data: notificationsList, error: queryError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (queryError) {
        throw queryError;
      }

      console.log(`Fetched ${notificationsList?.length || 0} notifications`);
      setNotifications((notificationsList || []) as Notification[]);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const supabase = createClient();

      // Obtener usuario autenticado
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("No autenticado");
      }

      // Marcar notificaciones como leídas directamente en Supabase
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .in("id", notificationIds);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notificationIds.includes(notif.id)
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (err) {
      console.error("Error marking notifications as read:", err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      const supabase = createClient();

      // Obtener usuario autenticado
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("No autenticado");
      }

      // Marcar todas las notificaciones no leídas como leídas
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      throw err;
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const setupRealtime = async () => {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (authError || !user) {
        console.error("Error getting user for notifications:", authError);
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      userIdRef.current = user.id;
      console.log(`Setting up notifications realtime for user: ${user.id}`);

      // Fetch initial notifications
      if (mounted) {
        await fetchNotifications();
      }

      if (!mounted) return;

      // Clean up any existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Set up realtime subscription for new notifications
      const channel = supabase
        .channel(`notifications:${user.id}`, {
          config: {
            presence: {
              key: user.id,
            },
          },
        })
        .on<Notification>(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload: RealtimePostgresChangesPayload<Notification>) => {
            if (!mounted) return;
            if (!payload.new) return;
            const newNotification = payload.new as Notification;
            console.log(
              "New notification received via realtime:",
              newNotification
            );
            setNotifications((prev) => {
              // Evitar duplicados
              const exists = prev.find((n) => n.id === newNotification.id);
              if (exists) {
                console.log("Notification already exists, skipping duplicate");
                return prev;
              }
              // Agregar al inicio de la lista
              return [newNotification, ...prev];
            });
          }
        )
        .on<Notification>(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload: RealtimePostgresChangesPayload<Notification>) => {
            if (!mounted) return;
            if (!payload.new) return;
            const updatedNotification = payload.new as Notification;
            console.log(
              "Notification updated via realtime:",
              updatedNotification
            );
            setNotifications((prev) =>
              prev.map((notif) =>
                notif.id === updatedNotification.id
                  ? updatedNotification
                  : notif
              )
            );
          }
        )
        .subscribe((status) => {
          if (!mounted) return;
          console.log(`Notifications realtime subscription status: ${status}`);
          if (status === "SUBSCRIBED") {
            console.log("✅ Successfully subscribed to notifications realtime");
            setError(null);
          } else if (status === "CHANNEL_ERROR") {
            console.error("❌ Error subscribing to notifications realtime");
            setError("Error al conectar con notificaciones en tiempo real");
          } else if (status === "TIMED_OUT") {
            console.warn("⏱️ Timeout subscribing to notifications realtime");
            setError("Timeout al conectar con notificaciones en tiempo real");
          }
        });

      if (mounted) {
        channelRef.current = channel;
      } else {
        // Component unmounted while setting up, clean up immediately
        supabase.removeChannel(channel);
      }
    };

    setupRealtime();

    return () => {
      mounted = false;
      // Cleanup: remove channel on unmount
      if (channelRef.current) {
        console.log("Cleaning up notifications channel");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      userIdRef.current = null;
    };
  }, [fetchNotifications]); // fetchNotifications is memoized with useCallback

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
