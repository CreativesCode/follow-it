import type { Metadata } from "next";
import { TrackingPageClient } from "./TrackingPageClient";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function TrackingPage(props: Props) {
  const params = await props.params;
  return <TrackingPageClient token={params.token} />;
}

// Metadata con OpenGraph completo para compartir en WhatsApp
export async function generateMetadata(): Promise<Metadata> {
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

  return {
    title: "Seguimiento de Pedido | Follow It",
    description: "Sigue tu pedido en tiempo real con Follow It",
    metadataBase: new URL(baseUrl),
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: `${baseUrl}/track`,
      siteName: "Follow It",
      title: "Seguimiento de Pedido | Follow It",
      description: "Sigue tu pedido en tiempo real con Follow It",
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
      title: "Seguimiento de Pedido | Follow It",
      description: "Sigue tu pedido en tiempo real con Follow It",
      images: [
        {
          url: ogImageUrl,
          alt: "Follow It - Seguimiento de Pedido",
        },
      ],
    },
  };
}
