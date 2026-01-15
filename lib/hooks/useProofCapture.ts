"use client";

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

        // 1. Obtener URL de subida
        setProgress(10);
        const requestBody = {
          order_id: orderId.trim(),
          type,
          lat: location?.lat,
          lng: location?.lng,
        };
        console.log(
          "useProofCapture: Enviando request a /api/proofs/upload-url",
          requestBody
        );

        const uploadUrlResponse = await fetch("/api/proofs/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!uploadUrlResponse.ok) {
          const data = await uploadUrlResponse.json();
          console.error(
            "useProofCapture: Error en /api/proofs/upload-url",
            data
          );
          throw new Error(data.error || "Error al obtener URL de subida");
        }

        const uploadData: ProofUploadResponse = await uploadUrlResponse.json();
        console.log("useProofCapture: URL de subida obtenida", {
          proof_id: uploadData.proof_id,
        });
        setProgress(30);

        // 2. Subir archivo
        console.log("useProofCapture: Subiendo archivo a storage");
        const uploadResponse = await fetch(uploadData.upload_url, {
          method: "PUT",
          headers: {
            "Content-Type": type === "signature" ? "image/png" : "image/jpeg",
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          console.error(
            "useProofCapture: Error al subir archivo",
            uploadResponse.status
          );
          throw new Error("Error al subir archivo");
        }
        console.log("useProofCapture: Archivo subido exitosamente");
        setProgress(70);

        // 3. Confirmar subida
        console.log("useProofCapture: Confirmando subida");
        const confirmResponse = await fetch("/api/proofs/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proof_id: uploadData.proof_id,
            captured_at: new Date().toISOString(),
          }),
        });

        if (!confirmResponse.ok) {
          const data = await confirmResponse.json();
          console.error("useProofCapture: Error al confirmar subida", data);
          throw new Error(data.error || "Error al confirmar subida");
        }

        console.log("useProofCapture: Proof confirmado exitosamente");
        setProgress(100);
        return { proofId: uploadData.proof_id };
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
