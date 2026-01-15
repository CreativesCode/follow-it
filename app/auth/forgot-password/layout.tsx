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
    title: "Recuperar Contraseña | Follow It",
    description:
      "Recupera el acceso a tu cuenta de Follow It. Te enviaremos un enlace para restablecer tu contraseña.",
    metadataBase: new URL(siteUrl),
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: `${siteUrl}/auth/forgot-password`,
      siteName: "Follow It",
      title: "Recuperar Contraseña | Follow It",
      description: "Recupera el acceso a tu cuenta de Follow It",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Follow It - Recuperar Contraseña",
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Recuperar Contraseña | Follow It",
      description: "Recupera el acceso a tu cuenta",
      images: [
        {
          url: ogImageUrl,
          alt: "Follow It - Recuperar Contraseña",
        },
      ],
    },
  };
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
