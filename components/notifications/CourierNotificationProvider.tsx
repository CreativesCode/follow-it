// components/notifications/CourierNotificationProvider.tsx
// Provider para manejar notificaciones de pedidos asignados a mensajeros

"use client";

import { useCourierNotifications } from "@/lib/hooks/useCourierNotifications";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { OrderAssignmentToast } from "./OrderAssignmentToast";

interface Order {
  id: string;
  code: string | null;
  dropoff_address: string;
}

interface CourierNotificationProviderProps {
  courierId: string;
  children: React.ReactNode;
  enabled?: boolean;
}

export function CourierNotificationProvider({
  courierId,
  children,
  enabled = true,
}: CourierNotificationProviderProps) {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const router = useRouter();

  const handleNewAssignment = useCallback((order: Order) => {
    setCurrentOrder(order);

    // Opcional: vibrar el dispositivo si está disponible
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  useCourierNotifications({
    courierId,
    onNewAssignment: handleNewAssignment,
    enabled,
  });

  const handleViewOrder = useCallback(
    (orderId: string) => {
      router.push(`/orders/${orderId}`);
    },
    [router]
  );

  const handleCloseToast = useCallback(() => {
    setCurrentOrder(null);
  }, []);

  return (
    <>
      {children}
      <OrderAssignmentToast
        order={currentOrder}
        onClose={handleCloseToast}
        onViewOrder={handleViewOrder}
      />
    </>
  );
}
