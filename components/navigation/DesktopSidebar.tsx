"use client";

import { Button } from "@/components/ui/Button";
import { logout } from "@/lib/auth/client-actions";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Home, LogOut, Package, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { roleType, user } = useAuth();

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
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <img
          src="/logo_horizontal.svg"
          alt="Follow It"
          className="h-8 w-auto"
        />
        <span className="ml-3 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
          {isBusiness ? "Negocio" : "Mensajero"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Para /dashboard, solo activo si es exactamente /dashboard
          // Para otras rutas, activo si coincide exactamente o empieza con la ruta + "/"
          const isActive =
            item.path === "/dashboard"
              ? pathname === item.path
              : pathname === item.path || pathname.startsWith(item.path + "/");

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
      <div className="border-t border-gray-200 p-4">
        <div className="mb-3 px-4">
          <p className="text-sm font-medium text-gray-900">
            {user?.user_metadata?.full_name || user?.email}
          </p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <form action={logout} className="w-full">
          <Button
            type="submit"
            variant="outline"
            className="w-full justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </form>
      </div>
    </aside>
  );
}
