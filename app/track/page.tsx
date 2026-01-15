import type { Metadata } from "next";
import { TrackingPageClient } from "./TrackingPageClient";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

type MetadataProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function TrackingPage(props: Props) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Token Requerido
          </h1>
          <p className="text-gray-600 mb-4">
            Por favor, proporciona un token de seguimiento válido en la URL.
          </p>
        </div>
      </div>
    );
  }

  return <TrackingPageClient token={token} />;
}

// Metadata con OpenGraph completo para compartir en WhatsApp
export async function generateMetadata(
  props: MetadataProps
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  // Obtener la URL base del sitio
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000";

  // Asegurar HTTPS en producción
  let baseUrl = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
  if (!baseUrl.includes("localhost") && baseUrl.startsWith("http://")) {
    baseUrl = baseUrl.replace("http://", "https://");
  }
  baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  const ogImageUrl = `${baseUrl}/opengraph.jpg`;
  const trackingUrl = token
    ? `${baseUrl}/track?token=${encodeURIComponent(token)}`
    : `${baseUrl}/track`;

  return {
    title: "Seguimiento de Pedido en Tiempo Real | Follow It",
    description:
      "Sigue tu pedido en tiempo real con Follow It. Visualiza la ubicación del mensajero, estado de entrega y recibe actualizaciones instantáneas.",
    metadataBase: new URL(baseUrl),
    robots: {
      index: false, // Las páginas de tracking con token no deben indexarse
      follow: false,
    },
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: trackingUrl,
      siteName: "Follow It",
      title: "Seguimiento de Pedido en Tiempo Real | Follow It",
      description:
        "Sigue tu pedido en tiempo real. Visualiza la ubicación del mensajero y el estado de tu entrega",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Follow It - Seguimiento de Pedido",
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Seguimiento de Pedido en Tiempo Real | Follow It",
      description:
        "Sigue tu pedido en tiempo real con ubicación GPS y actualizaciones instantáneas",
      images: [
        {
          url: ogImageUrl,
          alt: "Follow It - Seguimiento de Pedido",
        },
      ],
    },
  };
}
