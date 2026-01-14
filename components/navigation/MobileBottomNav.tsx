"use client";

import { useUserRole } from "@/lib/hooks/useUserRole";
import { Home, Package, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { type: roleType } = useUserRole();

  const isBusiness = roleType === "business";

  const navItems = isBusiness
    ? [
        {
          label: "Inicio",
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
          label: "Inicio",
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.path || pathname.startsWith(item.path + "/");

          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`
                flex flex-col items-center justify-center flex-1 h-full
                transition-colors duration-200
                ${isActive ? "text-primary-600" : "text-gray-500"}
              `}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? "scale-110" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
