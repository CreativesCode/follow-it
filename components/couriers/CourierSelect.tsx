"use client";

import { useState, useEffect } from "react";
import { User, ChevronDown, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Courier = {
  id: string;
  display_name: string;
  phone: string | null;
  is_active: boolean;
};

type Props = {
  businessId: string;
  value?: string | null;
  onChange: (courierId: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  showUnassignOption?: boolean;
};

export function CourierSelect({
  businessId,
  value,
  onChange,
  disabled = false,
  placeholder = "Seleccionar mensajero",
  showUnassignOption = false,
}: Props) {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchCouriers() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("couriers")
        .select("id, display_name, phone, is_active")
        .eq("business_id", businessId)
        .eq("is_active", true)
        .order("display_name");

      if (!error && data) {
        setCouriers(data);
      }
      setLoading(false);
    }

    fetchCouriers();
  }, [businessId]);

  const selectedCourier = couriers.find((c) => c.id === value);

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 px-3 py-2
          border rounded-lg bg-white text-left
          ${
            disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400"
          }
          ${isOpen ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-300"}
        `}
      >
        <div className="flex items-center gap-2 min-w-0">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <User className="w-4 h-4 text-gray-400 shrink-0" />
          )}
          <span
            className={`truncate ${
              selectedCourier ? "text-gray-900" : "text-gray-500"
            }`}
          >
            {selectedCourier?.display_name || placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10 safe-area-inset"
            onClick={() => setIsOpen(false)}
          />

          {/* Options */}
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {showUnassignOption && value && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Sin asignar</span>
              </button>
            )}

            {couriers.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500 text-sm">
                No hay mensajeros disponibles
              </div>
            ) : (
              couriers.map((courier) => (
                <button
                  key={courier.id}
                  type="button"
                  onClick={() => {
                    onChange(courier.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between
                    ${value === courier.id ? "bg-blue-50" : ""}
                  `}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {courier.display_name}
                      </p>
                      {courier.phone && (
                        <p className="text-xs text-gray-500 truncate">
                          {courier.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  {value === courier.id && (
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
