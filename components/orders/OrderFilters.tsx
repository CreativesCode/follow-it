"use client";

import { Button } from "@/components/ui/Button";
import { formInputBase } from "@/lib/utils/formStyles";
import { orderFiltersSchema } from "@/lib/validations/order";
import type { OrderFilters, OrderStatus } from "@/types/orders";
import { ORDER_STATUS_CONFIG } from "@/types/orders";
import { zodResolver } from "@hookform/resolvers/zod";
import { Filter, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  filters: OrderFilters;
  onFilterChange: (filters: Partial<OrderFilters>) => void;
};

export function OrderFilters({ filters, onFilterChange }: Props) {
  const [showFilters, setShowFilters] = useState(false);

  const statuses: (OrderStatus | "all")[] = [
    "all",
    "pending",
    "assigned",
    "en_route",
    "delivered",
    "failed",
    "canceled",
  ];

  // Ref para rastrear si el cambio viene del formulario (interno) o de props (externo)
  const isInternalUpdateRef = useRef(false);
  // Ref para rastrear los valores previos de los filtros para evitar actualizaciones innecesarias
  const prevFiltersRef = useRef({
    search: filters.search,
    status: filters.status,
    date_from: filters.date_from,
    date_to: filters.date_to,
  });

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(orderFiltersSchema),
    defaultValues: {
      search: filters.search || "",
      status: filters.status || "all",
      date_from: filters.date_from || "",
      date_to: filters.date_to || "",
    },
  });

  const statusValue = watch("status");

  // Sincronizar cambios del formulario con el callback
  useEffect(() => {
    const subscription = watch((value) => {
      // Solo actualizar si el cambio viene del formulario (no de props)
      if (!isInternalUpdateRef.current) {
        isInternalUpdateRef.current = true;
        onFilterChange({
          search: value.search || undefined,
          status: value.status || undefined,
          date_from: value.date_from || undefined,
          date_to: value.date_to || undefined,
        });
        // Resetear el flag en el siguiente tick
        requestAnimationFrame(() => {
          isInternalUpdateRef.current = false;
        });
      }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]); // onFilterChange es estable (useCallback), no necesita estar en deps

  // Sincronizar cambios externos al formulario
  useEffect(() => {
    // Solo actualizar si los valores realmente cambiaron y no es una actualización interna
    if (isInternalUpdateRef.current) {
      // Actualizar la ref de valores previos para evitar comparaciones incorrectas
      prevFiltersRef.current = {
        search: filters.search,
        status: filters.status,
        date_from: filters.date_from,
        date_to: filters.date_to,
      };
      return;
    }

    // Comparar con valores previos para evitar actualizaciones innecesarias
    const prev = prevFiltersRef.current;
    const hasSearchChanged = filters.search !== prev.search;
    const hasStatusChanged = filters.status !== prev.status;
    const hasDateFromChanged = filters.date_from !== prev.date_from;
    const hasDateToChanged = filters.date_to !== prev.date_to;

    // Solo actualizar si el valor realmente cambió desde props (no desde el formulario)
    if (hasSearchChanged) {
      isInternalUpdateRef.current = true;
      setValue("search", filters.search || "", {
        shouldDirty: false,
        shouldValidate: false,
      });
      requestAnimationFrame(() => {
        isInternalUpdateRef.current = false;
      });
    }
    if (hasStatusChanged) {
      isInternalUpdateRef.current = true;
      setValue("status", filters.status || "all", {
        shouldDirty: false,
        shouldValidate: false,
      });
      requestAnimationFrame(() => {
        isInternalUpdateRef.current = false;
      });
    }
    if (hasDateFromChanged) {
      isInternalUpdateRef.current = true;
      setValue("date_from", filters.date_from || "", {
        shouldDirty: false,
        shouldValidate: false,
      });
      requestAnimationFrame(() => {
        isInternalUpdateRef.current = false;
      });
    }
    if (hasDateToChanged) {
      isInternalUpdateRef.current = true;
      setValue("date_to", filters.date_to || "", {
        shouldDirty: false,
        shouldValidate: false,
      });
      requestAnimationFrame(() => {
        isInternalUpdateRef.current = false;
      });
    }

    // Actualizar la ref de valores previos
    prevFiltersRef.current = {
      search: filters.search,
      status: filters.status,
      date_from: filters.date_from,
      date_to: filters.date_to,
    };
  }, [
    filters.search,
    filters.status,
    filters.date_from,
    filters.date_to,
    setValue,
  ]);

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
          <input
            type="text"
            placeholder="Buscar por código, dirección..."
            {...register("search")}
            className={`${formInputBase} pl-10 ${
              errors.search ? "border-red-500" : ""
            }`}
          />
          {errors.search && (
            <p className="mt-1 text-sm text-red-500">{errors.search.message}</p>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtros
        </Button>

        {(filters.status !== "all" ||
          filters.courier_id !== "all" ||
          filters.date_from ||
          filters.date_to) && (
          <Button
            variant="ghost"
            onClick={() => {
              setValue("status", "all");
              setValue("date_from", "");
              setValue("date_to", "");
              onFilterChange({
                status: "all",
                courier_id: "all",
                date_from: undefined,
                date_to: undefined,
              });
            }}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Panel de filtros expandible */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setValue("status", status);
                    onFilterChange({ status });
                  }}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${
                      statusValue === status
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }
                  `}
                >
                  {status === "all"
                    ? "Todos"
                    : ORDER_STATUS_CONFIG[status].label}
                </button>
              ))}
            </div>
            {errors.status && (
              <p className="mt-1 text-sm text-red-500">
                {errors.status.message}
              </p>
            )}
          </div>

          {/* Filtro por fecha */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                {...register("date_from")}
                className={`${formInputBase} ${
                  errors.date_from ? "border-red-500" : ""
                }`}
              />
              {errors.date_from && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.date_from.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                {...register("date_to")}
                className={`${formInputBase} ${
                  errors.date_to ? "border-red-500" : ""
                }`}
              />
              {errors.date_to && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.date_to.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
