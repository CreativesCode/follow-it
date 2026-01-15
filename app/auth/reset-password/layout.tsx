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
    title: "Restablecer Contraseña | Follow It",
    description:
      "Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta de Follow It",
    metadataBase: new URL(siteUrl),
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: `${siteUrl}/auth/reset-password`,
      siteName: "Follow It",
      title: "Restablecer Contraseña | Follow It",
      description: "Ingresa tu nueva contraseña para restablecer tu cuenta",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Follow It - Restablecer Contraseña",
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Restablecer Contraseña | Follow It",
      description: "Restablece tu contraseña",
      images: [
        {
          url: ogImageUrl,
          alt: "Follow It - Restablecer Contraseña",
        },
      ],
    },
  };
}

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
