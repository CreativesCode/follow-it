"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NotificationDropdown } from "./NotificationDropdown";
import { OrderSearchModal } from "./OrderSearchModal";

type Props = {
  title?: string;
};

export function DesktopHeader({ title }: Props) {
  const { user } = useAuth();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const router = useRouter();

  const handleOrderFound = (orderId: string) => {
    console.log(
      "[DesktopHeader] handleOrderFound llamado con orderId:",
      orderId
    );
    console.log("[DesktopHeader] showSearchModal antes:", showSearchModal);

    // Cerrar el modal primero
    setShowSearchModal(false);
    console.log("[DesktopHeader] showSearchModal establecido a false");

    // Luego navegar a la página de órdenes
    console.log(
      "[DesktopHeader] Navegando a:",
      `/dashboard/orders?orderId=${orderId}`
    );
    router.push(`/dashboard/orders?orderId=${orderId}`);
    console.log("[DesktopHeader] router.push ejecutado");
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16">
        <div className="ml-64 flex items-center justify-between px-6 h-full">
          <div className="flex-1 min-w-0">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            )}
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setShowSearchModal(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Buscar pedido"
            >
              <Search className="w-5 h-5" />
            </button>
            <NotificationDropdown />
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">
                  {(user?.user_metadata?.full_name || user?.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <OrderSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onOrderFound={handleOrderFound}
      />
    </>
  );
}
