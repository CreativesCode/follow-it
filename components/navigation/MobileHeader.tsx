"use client";
import { logout } from "@/lib/auth/client-actions";
import { useAuth } from "@/lib/contexts/AuthContext";
import { LogOut } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";

type Props = {
  title?: string;
};

export function MobileHeader({ title }: Props) {
  const { roleType } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <div>
            <img src="/logo_horizontal.svg" alt="Follow It" className="h-8" />
            {title && <p className="text-xs text-gray-500 mt-0.5">{title}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationDropdown />
          <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
            {roleType === "business" ? "Negocio" : "Mensajero"}
          </span>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
