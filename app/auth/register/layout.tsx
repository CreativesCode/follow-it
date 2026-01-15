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
    title: "Crear Cuenta | Follow It",
    description:
      "Regístrate gratis en Follow It y comienza a gestionar tus repartos de manera profesional. Seguimiento en tiempo real, comprobantes digitales y más.",
    metadataBase: new URL(siteUrl),
    robots: {
      index: true, // La página de registro puede indexarse
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: `${siteUrl}/auth/register`,
      siteName: "Follow It",
      title: "Crear Cuenta Gratis | Follow It",
      description:
        "Regístrate gratis y comienza a gestionar tus repartos con seguimiento en tiempo real",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Follow It - Crear Cuenta",
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Crear Cuenta Gratis | Follow It",
      description: "Regístrate gratis y gestiona tus repartos profesionalmente",
      images: [
        {
          url: ogImageUrl,
          alt: "Follow It - Crear Cuenta",
        },
      ],
    },
  };
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
