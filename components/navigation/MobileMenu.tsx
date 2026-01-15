"use client";

import { Button } from "@/components/ui/Button";
import { logout } from "@/lib/auth/client-actions";
import { useUser } from "@/lib/hooks/useUser";
import { useUserRole } from "@/lib/hooks/useUserRole";
import { Home, LogOut, Package, Users, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function MobileMenu({ isOpen, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { type: roleType } = useUserRole();
  const { user } = useUser();

  const isBusiness = roleType === "business";

  const navItems = isBusiness
    ? [
        {
          label: "Dashboard",
          icon: Home,
          path: "/dashboard",
        },
        {
          label: "Pedidos",
          icon: Package,
          path: "/dashboard/orders",
        },
        {
          label: "Mensajeros",
          icon: Users,
          path: "/dashboard/couriers",
        },
      ]
    : [
        {
          label: "Dashboard",
          icon: Home,
          path: "/dashboard",
        },
        {
          label: "Pedidos",
          icon: Package,
          path: "/dashboard/orders",
        },
      ];

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden safe-area-inset"
          onClick={onClose}
        />
      )}

      {/* Menu */}
      <aside
        className={`
          fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 
          flex flex-col z-50 transform transition-transform duration-300 ease-in-out
          lg:hidden safe-area-left
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 safe-area-top">
          <div className="flex items-center gap-3">
            <img src="/logo_horizontal.svg" alt="Follow It" className="h-8" />
            <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
              {isBusiness ? "Negocio" : "Mensajero"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900"
            aria-label="Cerrar menú"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === "/dashboard"
                ? pathname === item.path
                : pathname === item.path ||
                  pathname.startsWith(item.path + "/");

            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`
                  w-full flex items-center px-4 py-3 rounded-lg
                  transition-colors duration-200
                  ${
                    isActive
                      ? "bg-primary-50 text-primary-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-200 p-4 safe-area-bottom">
          <div className="mb-3 px-4">
            <p className="text-sm font-medium text-gray-900">
              {user?.user_metadata?.full_name || user?.email}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>
    </>
  );
}
