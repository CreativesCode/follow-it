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
    title: "Mensajeros | Follow It",
    description:
      "Gestiona tu equipo de mensajeros, invita nuevos miembros y asigna pedidos",
    metadataBase: new URL(siteUrl),
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: `${siteUrl}/dashboard/couriers`,
      siteName: "Follow It",
      title: "Mensajeros | Follow It",
      description: "Gestiona tu equipo de mensajeros y asigna pedidos",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Follow It - Mensajeros",
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Mensajeros | Follow It",
      description: "Gestiona tu equipo de mensajeros",
      images: [
        {
          url: ogImageUrl,
          alt: "Follow It - Mensajeros",
        },
      ],
    },
  };
}

export default function CouriersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
