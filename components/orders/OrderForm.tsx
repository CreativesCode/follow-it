"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  formInputBase,
  formLabelBase,
  formTextareaBase,
} from "@/lib/utils/formStyles";
import { createOrderSchema } from "@/lib/validations/order";
import type { OrderFormData } from "@/types/orders";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Schema para el formulario (amount_cents en dólares)
const orderFormSchema = createOrderSchema.extend({
  amount_cents: z
    .number()
    .min(0, "El monto no puede ser negativo")
    .optional()
    .nullable(),
  customer_name: z.string().max(200).optional().nullable(),
  customer_phone: z.string().max(50).optional().nullable(),
});

type OrderFormInput = z.infer<typeof orderFormSchema>;

type Props = {
  onSubmit: (
    data: OrderFormData
  ) => Promise<{ order?: unknown; error?: string }>;
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

  // Convertir amount_cents de centavos a dólares para el formulario
  const defaultAmount =
    initialData?.amount_cents && typeof initialData.amount_cents === "number"
      ? initialData.amount_cents / 100
      : undefined;

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<OrderFormInput>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      dropoff_address: initialData?.dropoff_address || "",
      pickup_address: initialData?.pickup_address || "",
      items_summary: initialData?.items_summary || "",
      notes: initialData?.notes || "",
      amount_cents: defaultAmount,
      customer_name: initialData?.customer_name || "",
      customer_phone: initialData?.customer_phone || "",
    },
  });

  const amountValue = watch("amount_cents") ?? undefined;

  const onSubmitForm = async (data: OrderFormInput) => {
    setLoading(true);
    setError(null);

    const result = await onSubmit({
      dropoff_address: data.dropoff_address,
      items_summary: data.items_summary,
      pickup_address: data.pickup_address || undefined,
      notes: data.notes || undefined,
      // Convertir de dólares a centavos al enviar
      amount_cents: data.amount_cents
        ? Math.round(data.amount_cents * 100)
        : undefined,
      customer_name: data.customer_name || undefined,
      customer_phone: data.customer_phone || undefined,
      dropoff_lat: data.dropoff_lat || undefined,
      dropoff_lng: data.dropoff_lng || undefined,
    });

    if (result.error) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleFormSubmit(onSubmitForm)} className="space-y-4">
      {/* Dirección de entrega */}
      <div>
        <label className={formLabelBase}>
          Dirección de Entrega <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register("dropoff_address")}
          placeholder="Calle, número, ciudad..."
          rows={2}
          className={`${formTextareaBase} ${
            errors.dropoff_address ? "border-red-500" : ""
          }`}
        />
        {errors.dropoff_address && (
          <p className="mt-1 text-sm text-red-500">
            {errors.dropoff_address.message}
          </p>
        )}
      </div>

      {/* Dirección de recogida (opcional) */}
      <div>
        <label className={formLabelBase}>
          Dirección de Recogida (opcional)
        </label>
        <textarea
          {...register("pickup_address")}
          placeholder="Si es diferente a la dirección de entrega..."
          rows={2}
          className={`${formTextareaBase} ${
            errors.pickup_address ? "border-red-500" : ""
          }`}
        />
        {errors.pickup_address && (
          <p className="mt-1 text-sm text-red-500">
            {errors.pickup_address.message}
          </p>
        )}
      </div>

      {/* Items */}
      <div>
        <label className={formLabelBase}>
          Descripción de Items <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register("items_summary")}
          placeholder="Ej: 2x combo, 1x agua 10L, 1x pizza grande..."
          rows={3}
          className={`${formTextareaBase} ${
            errors.items_summary ? "border-red-500" : ""
          }`}
        />
        {errors.items_summary && (
          <p className="mt-1 text-sm text-red-500">
            {errors.items_summary.message}
          </p>
        )}
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
              amountValue !== undefined && amountValue !== null
                ? amountValue.toFixed(2)
                : ""
            }
            onChange={(e) => {
              const value = e.target.value;
              // Permitir solo números y un punto decimal
              if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                const numValue = value === "" ? undefined : parseFloat(value);
                setValue(
                  "amount_cents",
                  numValue && !isNaN(numValue) ? numValue : undefined,
                  { shouldValidate: true }
                );
              }
            }}
            onBlur={(e) => {
              // Formatear al perder el foco si hay un valor
              const value = e.target.value;
              if (value && !isNaN(parseFloat(value))) {
                const numValue = parseFloat(value);
                setValue("amount_cents", numValue, { shouldValidate: true });
              }
            }}
            placeholder="0.00"
            className={`${formInputBase} ${
              errors.amount_cents ? "border-red-500" : ""
            }`}
          />
        </div>
        {errors.amount_cents && (
          <p className="mt-1 text-sm text-red-500">
            {errors.amount_cents.message}
          </p>
        )}
      </div>

      {/* Cliente (opcional) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={formLabelBase}>Nombre Cliente (opcional)</label>
          <input
            type="text"
            {...register("customer_name")}
            placeholder="Nombre del cliente"
            className={`${formInputBase} ${
              errors.customer_name ? "border-red-500" : ""
            }`}
          />
          {errors.customer_name && (
            <p className="mt-1 text-sm text-red-500">
              {errors.customer_name.message}
            </p>
          )}
        </div>
        <div>
          <label className={formLabelBase}>Teléfono Cliente (opcional)</label>
          <input
            type="tel"
            {...register("customer_phone")}
            placeholder="+1234567890"
            className={`${formInputBase} ${
              errors.customer_phone ? "border-red-500" : ""
            }`}
          />
          {errors.customer_phone && (
            <p className="mt-1 text-sm text-red-500">
              {errors.customer_phone.message}
            </p>
          )}
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className={formLabelBase}>Notas Internas (opcional)</label>
        <textarea
          {...register("notes")}
          placeholder="Instrucciones especiales, notas para el mensajero..."
          rows={2}
          className={`${formTextareaBase} ${
            errors.notes ? "border-red-500" : ""
          }`}
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-500">{errors.notes.message}</p>
        )}
      </div>

      {/* Error */}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Botones */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t safe-area-bottom">
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
