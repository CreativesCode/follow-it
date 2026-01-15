"use client";
import { useUser } from "@/lib/hooks/useUser";
import { useUserRole } from "@/lib/hooks/useUserRole";
import { Menu } from "lucide-react";

type Props = {
  title?: string;
  onMenuClick?: () => void;
};

export function MobileHeader({ title, onMenuClick }: Props) {
  useUser();
  const { type: roleType } = useUserRole();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          <div>
            <img src="/logo_horizontal.svg" alt="Follow It" className="h-8" />
            {title && <p className="text-xs text-gray-500 mt-0.5">{title}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
            {roleType === "business" ? "Negocio" : "Mensajero"}
          </span>
        </div>
      </div>
    </header>
  );
}
