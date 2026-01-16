"use client";

import { createClient } from "@/lib/supabase/client";
import { proofUploadSchema, proofConfirmSchema } from "@/lib/validations/proof";
import type { ProofType, ProofUploadResponse } from "@/types/proofs";
import { useCallback, useState } from "react";

type UseProofCaptureReturn = {
  uploading: boolean;
  progress: number;
  error: string | null;
  captureAndUpload: (
    orderId: string,
    type: ProofType,
    file: File | Blob,
    location?: { lat: number; lng: number }
  ) => Promise<{ proofId?: string; error?: string }>;
};

export function useProofCapture(): UseProofCaptureReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const captureAndUpload = useCallback(
    async (
      orderId: string,
      type: ProofType,
      file: File | Blob,
      location?: { lat: number; lng: number }
    ) => {
      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        const supabase = createClient();

        // Validar orderId antes de hacer la petición
        if (!orderId || orderId.trim() === "") {
          console.error("useProofCapture: orderId inválido", { orderId });
          throw new Error("ID de pedido requerido");
        }

        console.log("useProofCapture: Iniciando captura", {
          orderId: orderId.trim(),
          type,
          hasLocation: !!location,
          fileSize: file.size,
        });

        // Obtener usuario autenticado
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("No autorizado");
        }

        // Validar datos con Zod
        const validatedData = proofUploadSchema.parse({
          order_id: orderId.trim(),
          type,
          lat: location?.lat,
          lng: location?.lng,
        });

        setProgress(10);

        // 1. Obtener pedido y verificar permisos
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select("id, business_id, status, assigned_courier_id")
          .eq("id", validatedData.order_id)
          .single();

        if (orderError || !order) {
          throw new Error("Pedido no encontrado");
        }

        // Obtener el courier_id del usuario autenticado
        const { data: courierData, error: courierError } = await supabase
          .from("couriers")
          .select("id, user_id")
          .eq("user_id", user.id)
          .eq("business_id", order.business_id)
          .eq("is_active", true)
          .single();

        if (courierError || !courierData) {
          throw new Error("Mensajero no encontrado o inactivo");
        }

        // Verificar que el courier_id coincide con el asignado al pedido
        if (courierData.id !== order.assigned_courier_id) {
          throw new Error("No eres el mensajero asignado a este pedido");
        }

        // Verificar estado válido para subir proof
        if (!["assigned", "en_route"].includes(order.status)) {
          throw new Error("Solo puedes subir comprobantes en pedidos activos");
        }

        setProgress(20);

        // 2. Generar ID y path
        const proofId = crypto.randomUUID();
        const extension = validatedData.type === "signature" ? "png" : "jpg";
        const storagePath = `proofs/${order.business_id}/${order.id}/${proofId}.${extension}`;

        // 3. Crear registro preliminar en BD
        const { error: insertError } = await supabase
          .from("order_proofs")
          .insert({
            id: proofId,
            business_id: order.business_id,
            order_id: order.id,
            courier_id: courierData.id,
            type: validatedData.type,
            storage_path: storagePath,
            lat: validatedData.lat ?? null,
            lng: validatedData.lng ?? null,
            captured_at: new Date().toISOString(),
          });

        if (insertError) {
          throw insertError;
        }

        setProgress(30);

        // 4. Generar signed upload URL directamente desde el cliente
        const { data: uploadData, error: uploadUrlError } = await supabase.storage
          .from("proofs")
          .createSignedUploadUrl(storagePath, {
            upsert: false,
          });

        if (uploadUrlError || !uploadData) {
          // Rollback: eliminar registro
          await supabase.from("order_proofs").delete().eq("id", proofId);
          throw uploadUrlError || new Error("Error al generar URL de subida");
        }

        setProgress(40);

        // 5. Subir archivo
        console.log("useProofCapture: Subiendo archivo a storage");
        const uploadResponse = await fetch(uploadData.signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type":
              validatedData.type === "signature" ? "image/png" : "image/jpeg",
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          // Rollback: eliminar registro
          await supabase.from("order_proofs").delete().eq("id", proofId);
          throw new Error("Error al subir archivo");
        }
        console.log("useProofCapture: Archivo subido exitosamente");
        setProgress(70);

        // 6. Verificar que el archivo existe en storage
        const pathParts = storagePath.split("/");
        const fileName = pathParts[pathParts.length - 1];
        const folderPath = pathParts.slice(0, -1).join("/");

        const { data: fileData, error: fileError } = await supabase.storage
          .from("proofs")
          .list(folderPath, {
            search: fileName,
          });

        if (fileError || !fileData || fileData.length === 0) {
          // Rollback: eliminar registro
          await supabase.from("order_proofs").delete().eq("id", proofId);
          throw new Error("El archivo no se subió correctamente");
        }

        setProgress(80);

        // 7. Crear evento
        await supabase.from("order_events").insert({
          business_id: order.business_id,
          order_id: order.id,
          type: "proof_uploaded",
          courier_id: courierData.id,
          created_by: user.id,
          meta: {
            proof_id: proofId,
            proof_type: validatedData.type,
          },
        });

        console.log("useProofCapture: Proof confirmado exitosamente");
        setProgress(100);
        return { proofId };
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        console.error("useProofCapture: Error en proceso completo", err);
        setError(errorMessage);
        return { error: errorMessage };
      } finally {
        setUploading(false);
      }
    },
    []
  );

  return {
    uploading,
    progress,
    error,
    captureAndUpload,
  };
}
