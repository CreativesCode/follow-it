"use client";

import { Button } from "@/components/ui/Button";
import { useProofCapture } from "@/lib/hooks/useProofCapture";
import { Check, MapPin, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  orderId: string;
  onSuccess: (proofId: string) => void;
  onCancel: () => void;
};

export function ProofCapture({ orderId, onSuccess, onCancel }: Props) {
  const [mode, setMode] = useState<"camera" | "preview">("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [gettingLocation, setGettingLocation] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { uploading, progress, error, captureAndUpload } = useProofCapture();

  // Iniciar cámara
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Cámara trasera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  }, []);

  // Detener cámara
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Capturar foto
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    // Convertir a blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setCapturedImage(URL.createObjectURL(blob));
          setMode("preview");
          stopCamera();
        }
      },
      "image/jpeg",
      0.8 // Calidad 80%
    );
  }, [stopCamera]);

  // Obtener ubicación
  const getLocation = useCallback(async () => {
    setGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocalización no soportada"));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        }
      );

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      console.log("Ubicación obtenida:", coords);
      setLocation(coords);
    } catch (err) {
      const errorMessage =
        err instanceof GeolocationPositionError
          ? err.code === 1
            ? "Permiso de ubicación denegado"
            : err.code === 2
            ? "Ubicación no disponible"
            : "Tiempo de espera agotado"
          : err instanceof Error
          ? err.message
          : "Error al obtener ubicación";
      console.error("Error al obtener ubicación:", errorMessage, err);
    } finally {
      setGettingLocation(false);
    }
  }, []);

  // Reintentar foto
  const retake = useCallback(() => {
    setCapturedImage(null);
    setCapturedBlob(null);
    setMode("camera");
    startCamera();
  }, [startCamera]);

  // Subir foto
  const handleUpload = useCallback(async () => {
    if (!capturedBlob) {
      console.error("No hay foto capturada");
      return;
    }

    if (!orderId || orderId.trim() === "") {
      console.error("No se puede subir: falta orderId", { orderId });
      return;
    }

    console.log("Iniciando subida de proof", {
      orderId,
      hasBlob: !!capturedBlob,
    });

    const result = await captureAndUpload(
      orderId.trim(),
      "photo",
      capturedBlob,
      location || undefined
    );

    if (result.proofId) {
      onSuccess(result.proofId);
    } else if (result.error) {
      console.error("Error al subir proof:", result.error);
    }
  }, [capturedBlob, orderId, location, captureAndUpload, onSuccess]);

  // Cancelar
  const handleCancel = useCallback(() => {
    stopCamera();
    onCancel();
  }, [stopCamera, onCancel]);

  // Iniciar cámara al montar
  useEffect(() => {
    if (!orderId || orderId.trim() === "") {
      console.error("ProofCapture: orderId no válido", { orderId });
      onCancel();
      return;
    }

    startCamera();
    getLocation();
    return () => stopCamera();
  }, [orderId, startCamera, getLocation, stopCamera, onCancel]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <button onClick={handleCancel} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>
        <span className="text-white font-medium">Tomar Foto</span>
        <div className="w-10" />
      </div>

      {/* Camera / Preview */}
      <div className="flex-1 relative overflow-hidden">
        {mode === "camera" ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={capturedImage!}
            alt="Captured"
            className="w-full h-full object-contain bg-black"
          />
        )}

        {/* Canvas oculto */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Location indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
          <MapPin
            className={`w-4 h-4 ${
              location ? "text-green-400" : "text-gray-400"
            }`}
          />
          <span className="text-white text-sm">
            {gettingLocation ? "Obteniendo..." : location ? "GPS ✓" : "Sin GPS"}
          </span>
        </div>

        {/* Progress bar */}
        {uploading && (
          <div className="absolute bottom-20 left-4 right-4">
            <div className="bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white text-center mt-2 text-sm">
              Subiendo... {progress}%
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/50">
        {mode === "camera" ? (
          <div className="flex justify-center">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center"
            >
              <div className="w-14 h-14 rounded-full border-4 border-black" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="ghost"
              onClick={retake}
              disabled={uploading}
              className="text-white"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Repetir
            </Button>

            <Button
              onClick={handleUpload}
              disabled={uploading}
              isLoading={uploading}
              className="px-8"
            >
              <Check className="w-5 h-5 mr-2" />
              Usar Foto
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-400 text-center mt-4 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
}
