"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
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
      // Remover el # del inicio si existe y codificar la URL correctamente
      const searchId = trimmedId.startsWith("#")
        ? trimmedId.substring(1)
        : trimmedId;
      const encodedId = encodeURIComponent(searchId);

      console.log(
        "[OrderSearchModal] Haciendo fetch a:",
        `/api/orders/${encodedId}`
      );
      const response = await fetch(`/api/orders/${encodedId}`);
      console.log(
        "[OrderSearchModal] Response recibido, status:",
        response.status
      );

      const data = await response.json();
      console.log("[OrderSearchModal] Data parseada:", data);

      if (!response.ok) {
        console.log("[OrderSearchModal] Response no OK, estableciendo error");
        if (response.status === 404) {
          setError(
            "Pedido no encontrado. Verifica el ID e intenta nuevamente."
          );
        } else {
          setError(data.error || "Error al buscar el pedido");
        }
        setLoading(false);
        console.log("[OrderSearchModal] Loading establecido a false (error)");
        return;
      }

      // Orden encontrada
      const foundOrderId = data.order?.id;
      console.log("[OrderSearchModal] Orden encontrada, ID:", foundOrderId);

      if (foundOrderId) {
        console.log(
          "[OrderSearchModal] Estableciendo loading a false ANTES de setLoading"
        );
        setLoading(false);
        console.log("[OrderSearchModal] setLoading(false) ejecutado");

        // Llamar al callback de orden encontrada (esto navegará)
        if (onOrderFound) {
          console.log(
            "[OrderSearchModal] Llamando onOrderFound con ID:",
            foundOrderId
          );
          onOrderFound(foundOrderId);
        } else {
          console.log(
            "[OrderSearchModal] Navegando directamente con router.push"
          );
          router.push(`/dashboard/orders?orderId=${foundOrderId}`);
        }

        console.log("[OrderSearchModal] handleSearch completado");
        return;
      } else {
        console.log(
          "[OrderSearchModal] No se encontró order.id en la respuesta"
        );
        setError("Pedido no encontrado");
        setLoading(false);
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
