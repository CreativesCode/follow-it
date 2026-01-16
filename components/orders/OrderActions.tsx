"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { changeStatusSchema } from "@/lib/validations/order";
import {
  recommendsProof,
  requiresNote,
  type OrderStatus,
} from "@/lib/constants/orderStatus";
import {
  Camera,
  CheckCircle,
  Loader2,
  MessageSquare,
  Play,
  XCircle,
} from "lucide-react";
import { useState } from "react";

type Props = {
  orderId: string;
  currentStatus: OrderStatus;
  onStatusChange: () => void;
  isCourier: boolean;
  onCaptureProof?: () => void;
};

// Función helper para verificar si hay acciones disponibles
export function hasCourierActions(
  currentStatus: OrderStatus,
  isCourier: boolean
): boolean {
  if (!isCourier) return false;
  return currentStatus === "assigned" || currentStatus === "en_route";
}

export function OrderActions({
  orderId,
  currentStatus,
  onStatusChange,
  isCourier,
  onCaptureProof,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState("");

  // Acciones disponibles para el mensajero
  const courierActions: Array<{
    toStatus: OrderStatus;
    label: string;
    icon: typeof Play;
    variant: "primary" | "danger";
  }> = [];

  if (isCourier) {
    if (currentStatus === "assigned") {
      courierActions.push({
        toStatus: "en_route",
        label: "Iniciar Entrega",
        icon: Play,
        variant: "primary",
      });
    }

    if (currentStatus === "en_route") {
      courierActions.push({
        toStatus: "delivered",
        label: "Marcar Entregado",
        icon: CheckCircle,
        variant: "primary",
      });
      courierActions.push({
        toStatus: "failed",
        label: "Marcar Fallido",
        icon: XCircle,
        variant: "danger",
      });
    }
  }

  const handleAction = async (toStatus: OrderStatus) => {
    // Si requiere nota y no la tenemos, mostrar input
    if (requiresNote(currentStatus, toStatus) && !note.trim()) {
      setShowNoteInput(true);
      setError("Debes indicar el motivo");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Obtener sesión para el token de acceso
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("No autorizado");
      }

      // Validar datos con Zod
      const validatedData = changeStatusSchema.parse({
        order_id: orderId,
        to_status: toStatus,
        note: note.trim() || undefined,
      });

      // Llamar directamente a la Edge Function
      const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/change_order_status`;

      const response = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cambiar estado");
      }

      // Limpiar y notificar
      setNote("");
      setShowNoteInput(false);
      onStatusChange();
    } catch (err: unknown) {
      console.error("Error changing order status:", err);

      // Manejar errores de validación de Zod
      if (
        err &&
        typeof err === "object" &&
        "name" in err &&
        err.name === "ZodError"
      ) {
        const zodError = err as {
          issues?: Array<{ path: (string | number)[]; message: string }>;
        };
        const details =
          zodError.issues?.map((issue) => issue.message).join(", ") || "";
        setError(`Datos inválidos: ${details}`);
      } else {
        const errorMessage =
          err instanceof Error ? err.message : "Error al cambiar estado";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (courierActions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Acciones */}
      <div className="flex flex-col gap-2">
        {courierActions.map((action) => (
          <Button
            key={action.toStatus}
            variant={action.variant}
            onClick={() => handleAction(action.toStatus)}
            disabled={loading}
            className="w-full justify-center py-3"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <action.icon className="w-5 h-5 mr-2" />
            )}
            {action.label}
          </Button>
        ))}
      </div>

      {/* Input de nota (para failed) */}
      {showNoteInput && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Motivo del fallo *
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: Cliente no estaba, dirección incorrecta..."
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      )}

      {/* Botón para capturar proof */}
      {onCaptureProof &&
        (currentStatus === "assigned" || currentStatus === "en_route") && (
          <Button
            variant="outline"
            onClick={onCaptureProof}
            className="w-full justify-center py-3"
          >
            <Camera className="w-5 h-5 mr-2" />
            Tomar Foto de Comprobante
          </Button>
        )}

      {/* Sugerencia de proof para delivered */}
      {currentStatus === "en_route" &&
        recommendsProof(currentStatus, "delivered") && (
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            <Camera className="w-4 h-4 inline mr-1" />
            Tip: Toma una foto como comprobante antes de marcar entregado
          </div>
        )}

      {/* Error */}
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}
