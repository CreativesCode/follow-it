"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onOrderFound?: (orderId: string) => void;
};

export function OrderSearchModal({ isOpen, onClose, onOrderFound }: Props) {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Log cuando cambia el estado de loading
  useEffect(() => {
    console.log("[OrderSearchModal] Estado de loading cambió a:", loading);
  }, [loading]);

  // Asegurar que el loading siempre se detenga cuando el modal se cierra
  useEffect(() => {
    console.log("[OrderSearchModal] useEffect isOpen cambió a:", isOpen);
    if (!isOpen) {
      console.log("[OrderSearchModal] Modal cerrado, reseteando estado");
      setLoading(false);
      setError(null);
      setOrderId("");
      console.log("[OrderSearchModal] Estado reseteado");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Enfocar el input cuando se abre el modal
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    console.log("[OrderSearchModal] handleSearch iniciado");

    const trimmedId = orderId.trim();
    if (!trimmedId) {
      console.log("[OrderSearchModal] ID vacío");
      setError("Por favor ingresa un ID de pedido");
      return;
    }

    console.log("[OrderSearchModal] Iniciando búsqueda con ID:", trimmedId);
    setLoading(true);
    setError(null);
    console.log("[OrderSearchModal] Loading establecido a true");

    try {
      const supabase = createClient();

      // Obtener usuario autenticado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("No autorizado");
        setLoading(false);
        return;
      }

      // Obtener rol del usuario
      const { data: businessMember } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      const { data: courier } = await supabase
        .from("couriers")
        .select("id, business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!businessMember && !courier) {
        setError("No autorizado");
        setLoading(false);
        return;
      }

      // Preparar el ID de búsqueda (puede ser UUID o código)
      const searchId = trimmedId;

      // Query base - RLS manejará los permisos
      let query = supabase.from("orders").select(
        `
        *,
        courier:couriers!assigned_courier_id(id, display_name, phone),
        customer:customers(id, name, phone)
      `
      );

      // Buscar por ID (UUID) o por código
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          searchId
        );

      if (isUUID) {
        query = query.eq("id", searchId);
      } else {
        // Asegurar que el código tenga el # al inicio
        const codeToSearch = searchId.startsWith("#") ? searchId : `#${searchId}`;
        query = query.eq("code", codeToSearch);
      }

      // Si es business member, filtrar por business_id
      if (businessMember) {
        query = query.eq("business_id", businessMember.business_id);
      }
      // Si es courier, RLS automáticamente filtra por assigned_courier_id

      const { data: order, error } = await query.single();

      if (error || !order) {
        setError("Pedido no encontrado. Verifica el ID e intenta nuevamente.");
        setLoading(false);
        return;
      }

      // Orden encontrada
      const foundOrderId = order.id;
      console.log("[OrderSearchModal] Orden encontrada, ID:", foundOrderId);

      setLoading(false);

      // Llamar al callback de orden encontrada (esto navegará)
      if (onOrderFound) {
        onOrderFound(foundOrderId);
      } else {
        router.push(`/dashboard/orders?orderId=${foundOrderId}`);
      }
    } catch (err: unknown) {
      console.error("[OrderSearchModal] Error en handleSearch:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error al buscar el pedido";
      setError(errorMessage);
      setLoading(false);
      console.log("[OrderSearchModal] Loading establecido a false (catch)");
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setOrderId(text.trim());
      setError(null);
    } catch {
      // Si falla el clipboard API, simplemente permitir pegar normalmente
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm safe-area-inset modal-container"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90dvh] overflow-hidden flex flex-col modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto p-6 modal-form-content">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Buscar Pedido
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label
                htmlFor="order-id-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ID del Pedido
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  id="order-id-input"
                  type="text"
                  value={orderId}
                  onChange={(e) => {
                    setOrderId(e.target.value);
                    setError(null);
                  }}
                  onPaste={handlePaste}
                  placeholder="Pega o escribe el ID del pedido"
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={loading}
                  autoComplete="off"
                />
                {loading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Presiona Enter o haz clic en Buscar
              </p>
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={loading}
                disabled={loading || !orderId.trim()}
                className="flex-1"
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
