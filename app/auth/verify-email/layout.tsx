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
    title: "Verificar Email | Follow It",
    description:
      "Verifica tu dirección de correo electrónico para activar tu cuenta de Follow It",
    metadataBase: new URL(siteUrl),
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: `${siteUrl}/auth/verify-email`,
      siteName: "Follow It",
      title: "Verificar Email | Follow It",
      description: "Verifica tu correo electrónico para activar tu cuenta",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Follow It - Verificar Email",
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Verificar Email | Follow It",
      description: "Verifica tu correo electrónico",
      images: [
        {
          url: ogImageUrl,
          alt: "Follow It - Verificar Email",
        },
      ],
    },
  };
}

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
