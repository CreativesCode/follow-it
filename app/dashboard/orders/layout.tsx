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
    title: "Pedidos | Follow It",
    description:
      "Gestiona y monitorea todos tus pedidos y entregas desde un solo lugar",
    metadataBase: new URL(siteUrl),
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: `${siteUrl}/dashboard/orders`,
      siteName: "Follow It",
      title: "Pedidos | Follow It",
      description: "Gestiona y monitorea todos tus pedidos y entregas",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Follow It - Pedidos",
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Pedidos | Follow It",
      description: "Gestiona todos tus pedidos",
      images: [
        {
          url: ogImageUrl,
          alt: "Follow It - Pedidos",
        },
      ],
    },
  };
}

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
