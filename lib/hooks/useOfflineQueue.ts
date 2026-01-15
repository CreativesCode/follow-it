"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type QueueItem<T> = {
  id: string; // Client-generated unique ID
  data: T;
  timestamp: number;
  retries: number;
  lastError?: string;
};

type QueueConfig = {
  maxItems: number;
  maxRetries: number;
  retryDelayMs: number;
  maxAgeMs: number;
};

type UseOfflineQueueReturn<T> = {
  queue: QueueItem<T>[];
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  add: (data: T) => string;
  remove: (id: string) => void;
  clear: () => void;
  sync: () => Promise<void>;
};

const DEFAULT_CONFIG: QueueConfig = {
  maxItems: 20,
  maxRetries: 3,
  retryDelayMs: 5000,
  maxAgeMs: 60 * 60 * 1000, // 1 hora
};

export function useOfflineQueue<T>(
  storageKey: string,
  syncFn: (
    items: QueueItem<T>[]
  ) => Promise<{ succeeded: string[]; failed: string[] }>,
  config: Partial<QueueConfig> = {}
): UseOfflineQueueReturn<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const [queue, setQueue] = useState<QueueItem<T>[]>([]);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState(false);

  const syncingRef = useRef(false);

  // Cargar desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as QueueItem<T>[];
        // Filtrar items viejos
        const now = Date.now();
        const valid = parsed.filter(
          (item) => now - item.timestamp < cfg.maxAgeMs
        );
        setQueue(valid);
      }
    } catch (err) {
      console.error("Error loading offline queue:", err);
    }
  }, [storageKey, cfg.maxAgeMs]);

  // Guardar en localStorage cuando cambia
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(queue));
    } catch (err) {
      console.error("Error saving offline queue:", err);
    }
  }, [queue, storageKey]);

  // Detectar cambios de conectividad
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Agregar item a la cola
  const add = useCallback(
    (data: T): string => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      setQueue((prev) => {
        const newItem: QueueItem<T> = {
          id,
          data,
          timestamp: Date.now(),
          retries: 0,
        };

        const newQueue = [...prev, newItem];

        // Limitar tamaño
        if (newQueue.length > cfg.maxItems) {
          return newQueue.slice(-cfg.maxItems);
        }

        return newQueue;
      });

      return id;
    },
    [cfg.maxItems]
  );

  // Remover item
  const remove = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Limpiar cola
  const clear = useCallback(() => {
    setQueue([]);
  }, []);

  // Sincronizar cola
  const sync = useCallback(async () => {
    if (syncingRef.current || queue.length === 0 || !isOnline) {
      return;
    }

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      // Filtrar items que no exceden max retries
      const toSync = queue.filter((item) => item.retries < cfg.maxRetries);

      if (toSync.length === 0) {
        return;
      }

      const result = await syncFn(toSync);

      // Actualizar cola
      setQueue((prev) => {
        return prev
          .filter((item) => !result.succeeded.includes(item.id))
          .map((item) => {
            if (result.failed.includes(item.id)) {
              return { ...item, retries: item.retries + 1 };
            }
            return item;
          });
      });
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [queue, isOnline, cfg.maxRetries, syncFn]);

  // Auto-sync cuando vuelve online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      sync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  return {
    queue,
    isOnline,
    isSyncing,
    pendingCount: queue.length,
    add,
    remove,
    clear,
    sync,
  };
}
