import type { Metadata } from "next";

// Helper para obtener la URL base del sitio
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
    title: "Autenticación | Follow It",
    description:
      "Inicia sesión o regístrate en Follow It para gestionar tus repartos de manera profesional",
    metadataBase: new URL(siteUrl),
    robots: {
      index: false, // Las páginas de auth generalmente no deben indexarse
      follow: false,
    },
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: `${siteUrl}/auth`,
      siteName: "Follow It",
      title: "Autenticación | Follow It",
      description:
        "Inicia sesión o regístrate en Follow It para gestionar tus repartos",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Follow It - Autenticación",
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Autenticación | Follow It",
      description: "Inicia sesión o regístrate en Follow It",
      images: [
        {
          url: ogImageUrl,
          alt: "Follow It - Autenticación",
        },
      ],
    },
  };
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
