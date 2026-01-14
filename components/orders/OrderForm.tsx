"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  formInputBase,
  formLabelBase,
  formTextareaBase,
} from "@/lib/utils/formStyles";
import type { OrderFormData } from "@/types/orders";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
  onSubmit: (data: OrderFormData) => Promise<{ order?: any; error?: string }>;
  onCancel: () => void;
  initialData?: Partial<OrderFormData>;
  mode?: "create" | "edit";
  submitLabel?: string;
};

export function OrderForm({
  onSubmit,
  onCancel,
  initialData,
  mode = "create",
  submitLabel,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // amount_cents: en formData siempre guardamos en dólares para el input
  // Al enviar, se convierte a centavos
  const [formData, setFormData] = useState<OrderFormData>({
    dropoff_address: initialData?.dropoff_address || "",
    pickup_address: initialData?.pickup_address || "",
    items_summary: initialData?.items_summary || "",
    notes: initialData?.notes || "",
    // initialData.amount_cents ya viene en dólares (dividido en OrderDetailPageClient)
    amount_cents: initialData?.amount_cents,
    customer_name: initialData?.customer_name || "",
    customer_phone: initialData?.customer_phone || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validación básica
    if (!formData.dropoff_address.trim()) {
      setError("La dirección de entrega es requerida");
      setLoading(false);
      return;
    }

    if (!formData.items_summary.trim()) {
      setError("La descripción de items es requerida");
      setLoading(false);
      return;
    }

    const result = await onSubmit({
      ...formData,
      pickup_address: formData.pickup_address || undefined,
      notes: formData.notes || undefined,
      // Convertir de dólares a centavos al enviar
      amount_cents: formData.amount_cents
        ? Math.round(formData.amount_cents * 100)
        : undefined,
      customer_name: formData.customer_name || undefined,
      customer_phone: formData.customer_phone || undefined,
    });

    if (result.error) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Dirección de entrega */}
      <div>
        <label className={formLabelBase}>
          Dirección de Entrega <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.dropoff_address}
          onChange={(e) =>
            setFormData({ ...formData, dropoff_address: e.target.value })
          }
          placeholder="Calle, número, ciudad..."
          rows={2}
          required
          className={formTextareaBase}
        />
      </div>

      {/* Dirección de recogida (opcional) */}
      <div>
        <label className={formLabelBase}>
          Dirección de Recogida (opcional)
        </label>
        <textarea
          value={formData.pickup_address || ""}
          onChange={(e) =>
            setFormData({ ...formData, pickup_address: e.target.value })
          }
          placeholder="Si es diferente a la dirección de entrega..."
          rows={2}
          className={formTextareaBase}
        />
      </div>

      {/* Items */}
      <div>
        <label className={formLabelBase}>
          Descripción de Items <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.items_summary}
          onChange={(e) =>
            setFormData({ ...formData, items_summary: e.target.value })
          }
          placeholder="Ej: 2x combo, 1x agua 10L, 1x pizza grande..."
          rows={3}
          required
          className={formTextareaBase}
        />
      </div>

      {/* Monto */}
      <div>
        <label className={formLabelBase}>Monto (opcional)</label>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 font-medium">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={
              formData.amount_cents
                ? typeof formData.amount_cents === "number"
                  ? formData.amount_cents.toFixed(2)
                  : String(formData.amount_cents)
                : ""
            }
            onChange={(e) => {
              const value = e.target.value;
              // Permitir solo números y un punto decimal
              if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                const numValue = value === "" ? undefined : parseFloat(value);
                setFormData({
                  ...formData,
                  // Guardar en dólares (se convertirá a centavos al enviar)
                  amount_cents:
                    numValue && !isNaN(numValue) ? numValue : undefined,
                });
              }
            }}
            onBlur={(e) => {
              // Formatear al perder el foco si hay un valor
              const value = e.target.value;
              if (value && !isNaN(parseFloat(value))) {
                const numValue = parseFloat(value);
                setFormData({
                  ...formData,
                  // Mantener en dólares
                  amount_cents: numValue,
                });
              }
            }}
            placeholder="0.00"
            className={formInputBase}
          />
        </div>
      </div>

      {/* Cliente (opcional) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={formLabelBase}>Nombre Cliente (opcional)</label>
          <input
            type="text"
            value={formData.customer_name || ""}
            onChange={(e) =>
              setFormData({ ...formData, customer_name: e.target.value })
            }
            placeholder="Nombre del cliente"
            className={formInputBase}
          />
        </div>
        <div>
          <label className={formLabelBase}>Teléfono Cliente (opcional)</label>
          <input
            type="tel"
            value={formData.customer_phone || ""}
            onChange={(e) =>
              setFormData({ ...formData, customer_phone: e.target.value })
            }
            placeholder="+1234567890"
            className={formInputBase}
          />
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className={formLabelBase}>Notas Internas (opcional)</label>
        <textarea
          value={formData.notes || ""}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Instrucciones especiales, notas para el mensajero..."
          rows={2}
          className={formTextareaBase}
        />
      </div>

      {/* Error */}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Botones */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {submitLabel ||
            (mode === "edit" ? "Guardar Cambios" : "Crear Pedido")}
        </Button>
      </div>
    </form>
  );
}
