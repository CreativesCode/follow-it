import type { Metadata } from "next";

function getSiteUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000";

  let baseUrl = url.startsWith("http") ? url : `https://${url}`;
  if (!baseUrl.includes("localhost") && baseUrl.startsWith("http://")) {
    baseUrl = baseUrl.replace("http://", "https://");
  }
  baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return baseUrl;
}

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const ogImageUrl = `${siteUrl}/opengraph.jpg`;

  return {
    title: "Debug OpenGraph | Follow It",
    description:
      "Herramienta de depuración para verificar y validar los meta tags de OpenGraph y Twitter Card",
    metadataBase: new URL(siteUrl),
    robots: {
      index: false, // Página de debug no debe indexarse
      follow: false,
    },
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: `${siteUrl}/debug-og`,
      siteName: "Follow It",
      title: "Debug OpenGraph | Follow It",
      description: "Herramienta de depuración para meta tags OpenGraph",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Follow It - Debug OpenGraph",
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Debug OpenGraph | Follow It",
      description: "Herramienta de depuración para meta tags",
      images: [
        {
          url: ogImageUrl,
          alt: "Follow It - Debug OpenGraph",
        },
      ],
    },
  };
}

export default function DebugOGLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
