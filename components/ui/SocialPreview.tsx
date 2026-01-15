"use client";

import { useEffect, useState } from "react";

interface SocialPreviewProps {
  url?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
}

export function SocialPreview({
  url = "",
  title = "Follow It - Gestión de Repartos",
  description = "Optimiza tus entregas con seguimiento en tiempo real, asignación inteligente y comprobantes digitales",
  imageUrl = "/opengraph.jpg",
}: SocialPreviewProps) {
  const [mounted, setMounted] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [fullImageUrl, setFullImageUrl] = useState("");

  useEffect(() => {
    // Usar requestAnimationFrame para evitar renders en cascada
    const initializeUrls = () => {
      setMounted(true);
      if (typeof window !== "undefined") {
        const origin = window.location.origin;
        setCurrentUrl(url || origin);
        setFullImageUrl(
          imageUrl.startsWith("http") ? imageUrl : `${origin}${imageUrl}`
        );
      }
    };

    requestAnimationFrame(initializeUrls);
  }, [url, imageUrl]);

  // Helper para obtener hostname de forma segura
  const getHostname = (url: string): string => {
    try {
      if (!url) return "Cargando...";
      return new URL(url).hostname;
    } catch {
      return url || "Cargando...";
    }
  };

  if (!mounted || !currentUrl) {
    return (
      <div className="border rounded-lg p-4 bg-gray-100 animate-pulse">
        <div className="h-48 bg-gray-300 rounded mb-3"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* WhatsApp Preview */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="bg-green-600 text-white px-4 py-2 text-sm font-semibold">
          Vista previa de WhatsApp
        </div>
        <div className="p-4">
          <div className="border rounded-lg overflow-hidden bg-gray-50 max-w-sm">
            {/* Imagen */}
            <div className="w-full aspect-[1.91/1] bg-gray-200 relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullImageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'%3E%3Crect fill='%23ddd' width='1200' height='630'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='48' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
            {/* Contenido */}
            <div className="p-3 bg-white">
              <div className="text-xs text-gray-500 mb-1 truncate">
                {getHostname(currentUrl).toUpperCase()}
              </div>
              <div className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                {title}
              </div>
              <div className="text-xs text-gray-600 line-clamp-2">
                {description}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Facebook Preview */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold">
          Vista previa de Facebook
        </div>
        <div className="p-4">
          <div className="border rounded-lg overflow-hidden bg-gray-50 max-w-lg">
            {/* Imagen */}
            <div className="w-full aspect-[1.91/1] bg-gray-200 relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullImageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'%3E%3Crect fill='%23ddd' width='1200' height='630'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='48' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
            {/* Contenido */}
            <div className="p-3 bg-white border-t">
              <div className="text-xs text-gray-500 mb-1 uppercase">
                {getHostname(currentUrl)}
              </div>
              <div className="font-semibold text-base text-gray-900 mb-1">
                {title}
              </div>
              <div className="text-sm text-gray-600 line-clamp-2">
                {description}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Twitter Preview */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="bg-sky-500 text-white px-4 py-2 text-sm font-semibold">
          Vista previa de Twitter / X
        </div>
        <div className="p-4">
          <div className="border rounded-2xl overflow-hidden bg-gray-50 max-w-lg">
            {/* Imagen */}
            <div className="w-full aspect-2/1 bg-gray-200 relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullImageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'%3E%3Crect fill='%23ddd' width='1200' height='630'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='48' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
            {/* Contenido */}
            <div className="p-3 bg-white">
              <div className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                {title}
              </div>
              <div className="text-xs text-gray-600 line-clamp-2 mb-2">
                {description}
              </div>
              <div className="text-xs text-gray-500 truncate">
                🔗 {getHostname(currentUrl)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información técnica */}
      <div className="border rounded-lg bg-blue-50 border-blue-200 p-4">
        <h3 className="font-semibold text-sm text-blue-900 mb-2">
          Información técnica
        </h3>
        <div className="space-y-1 text-xs text-blue-800 font-mono">
          <div>
            <span className="font-semibold">URL:</span> {currentUrl}
          </div>
          <div>
            <span className="font-semibold">Imagen:</span> {fullImageUrl}
          </div>
          <div>
            <span className="font-semibold">Título:</span> {title}
          </div>
          <div>
            <span className="font-semibold">Descripción:</span> {description}
          </div>
        </div>
      </div>

      {/* Advertencias */}
      <div className="border rounded-lg bg-yellow-50 border-yellow-200 p-4">
        <h3 className="font-semibold text-sm text-yellow-900 mb-2">
          ⚠️ Importante
        </h3>
        <ul className="list-disc list-inside space-y-1 text-xs text-yellow-800">
          <li>Esta es una simulación aproximada de cómo se verá el enlace</li>
          <li>El aspecto real puede variar ligeramente en cada plataforma</li>
          <li>
            WhatsApp puede tardar varios segundos en generar la vista previa
          </li>
          <li>
            Si ya compartiste el enlace antes, WhatsApp tiene la versión en
            caché
          </li>
          <li>Para actualizar el caché, cambia el nombre de la imagen</li>
        </ul>
      </div>
    </div>
  );
}
