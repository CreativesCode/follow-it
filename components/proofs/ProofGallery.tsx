"use client";

import type { OrderProofWithUrl } from "@/types/proofs";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, FileSignature, Image, Loader2, MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  orderId: string;
};

export function ProofGallery({ orderId }: Props) {
  const [proofs, setProofs] = useState<OrderProofWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<OrderProofWithUrl | null>(
    null
  );

  console.log("ProofGallery: Renderizando con orderId", {
    orderId,
    type: typeof orderId,
    length: orderId?.length,
  });

  useEffect(() => {
    if (!orderId || typeof orderId !== "string" || orderId.trim() === "") {
      console.log("ProofGallery: orderId no válido", { orderId });
      setLoading(false);
      setProofs([]);
      return;
    }

    async function fetchProofs() {
      try {
        const url = `/api/orders/${encodeURIComponent(orderId.trim())}/proofs`;
        console.log("ProofGallery: Fetching proofs from", url);
        const response = await fetch(url);

        // Verificar que la respuesta tenga contenido
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error("ProofGallery: Respuesta no es JSON:", contentType);
          setLoading(false);
          return;
        }

        // Verificar que haya contenido antes de parsear
        const text = await response.text();
        if (!text || text.trim() === "") {
          console.error("ProofGallery: Respuesta vacía");
          setLoading(false);
          return;
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error(
            "ProofGallery: Error al parsear JSON:",
            parseError,
            "Texto:",
            text
          );
          setLoading(false);
          return;
        }

        if (response.ok) {
          console.log(
            `ProofGallery: ${data.proofs?.length || 0} proofs encontrados`
          );
          setProofs(data.proofs || []);
        } else {
          console.error(
            "ProofGallery: Error en respuesta:",
            data.error || "Error desconocido",
            "Status:",
            response.status
          );
        }
      } catch (err) {
        console.error("ProofGallery: Error fetching proofs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProofs();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (proofs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Sin comprobantes</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid de thumbnails */}
      <div className="grid grid-cols-3 gap-2">
        {proofs.map((proof) => (
          <button
            key={proof.id}
            onClick={() => setSelectedProof(proof)}
            className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity relative"
          >
            {proof.signed_url ? (
              <img
                src={proof.signed_url}
                alt={proof.type}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {proof.type === "photo" ? (
                  <Image className="w-8 h-8 text-gray-400" />
                ) : (
                  <FileSignature className="w-8 h-8 text-gray-400" />
                )}
              </div>
            )}

            {/* Badge tipo */}
            <span className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
              {proof.type === "photo" ? "📷" : "✍️"}
            </span>
          </button>
        ))}
      </div>

      {/* Modal visor */}
      {selectedProof && (
        <ProofViewer
          proof={selectedProof}
          onClose={() => setSelectedProof(null)}
        />
      )}
    </>
  );
}

// Componente visor
function ProofViewer({
  proof,
  onClose,
}: {
  proof: OrderProofWithUrl;
  onClose: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(
    proof.signed_url || null
  );
  const [loading, setLoading] = useState(!proof.signed_url);

  useEffect(() => {
    if (!proof.signed_url) {
      // Obtener signed URL
      fetch(`/api/proofs/${proof.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.signed_url) {
            setImageUrl(data.signed_url);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [proof]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="text-white">
          <p className="font-medium">
            {proof.type === "photo" ? "Foto" : "Firma"}
          </p>
          <p className="text-sm text-gray-400">
            <Clock className="w-3 h-3 inline mr-1" />
            {formatDistanceToNow(new Date(proof.captured_at), {
              addSuffix: true,
              locale: es,
            })}
          </p>
        </div>
        <button onClick={onClose} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Imagen */}
      <div className="flex-1 flex items-center justify-center p-4">
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={proof.type}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <p className="text-gray-400">Error al cargar imagen</p>
        )}
      </div>

      {/* Footer con ubicación */}
      {proof.lat && proof.lng && (
        <div className="p-4 bg-black/50">
          <div className="flex items-center gap-2 text-white text-sm">
            <MapPin className="w-4 h-4" />
            <span>
              {proof.lat.toFixed(6)}, {proof.lng.toFixed(6)}
            </span>
            <a
              href={`https://maps.google.com/?q=${proof.lat},${proof.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline ml-2"
            >
              Ver en mapa
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
