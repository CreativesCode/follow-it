import { AuthProvider } from "@/lib/contexts/AuthContext";
import { AuthGuard } from "@/lib/components/AuthGuard";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Función helper para obtener la URL base del sitio
// Para SPA estático, usamos variables de entorno en build time
function getSiteUrl() {
  // En producción, usar NEXT_PUBLIC_SITE_URL o NEXT_PUBLIC_VERCEL_URL
  // En desarrollo, usar localhost
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000";

  // Asegurar que tenga https:// cuando no sea localhost
  // WhatsApp REQUIERE HTTPS para las imágenes Open Graph
  let baseUrl = url.startsWith("http") ? url : `https://${url}`;

  // Forzar HTTPS en producción (no localhost)
  if (!baseUrl.includes("localhost") && baseUrl.startsWith("http://")) {
    baseUrl = baseUrl.replace("http://", "https://");
  }

  // Remover trailing slash para construir URLs correctamente
  baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  return baseUrl;
}

// Metadata estática para SPA puro
// En exportación estática, no podemos usar funciones async
const siteUrl = getSiteUrl();
const ogImageUrl = `${siteUrl}/opengraph.jpg`;

export const metadata: Metadata = {
  title: "Follow It - Gestión de Repartos",
  description:
    "Sistema de gestión de repartos con seguimiento en tiempo real",
  keywords: [
    "gestión de repartos",
    "seguimiento de entregas",
    "logística",
    "mensajería",
    "delivery",
    "comprobantes digitales",
    "seguimiento en tiempo real",
  ],
  authors: [{ name: "Follow It" }],
  creator: "Follow It",
  publisher: "Follow It",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // metadataBase es crucial para que Next.js resuelva URLs relativas
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: siteUrl,
    siteName: "Follow It",
    title: "Follow It - Gestión de Repartos",
    description:
      "Optimiza tus entregas con seguimiento en tiempo real, asignación inteligente y comprobantes digitales",
    images: [
      {
        // URL completamente absoluta HTTPS - CRÍTICO para WhatsApp
        // WhatsApp requiere:
        // 1. URL absoluta con protocolo HTTPS (no HTTP)
        // 2. Dimensiones explícitas (width y height)
        // 3. Archivo accesible públicamente sin autenticación
        // 4. Tamaño del archivo < 300 KB (actual: 137 KB ✓)
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Follow It - Gestión de Repartos",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Follow It - Gestión de Repartos",
    description:
      "Optimiza tus entregas con seguimiento en tiempo real, asignación inteligente y comprobantes digitales",
    // URL completamente absoluta también para Twitter
    images: [
      {
        url: ogImageUrl,
        alt: "Follow It - Gestión de Repartos",
      },
    ],
    creator: "@followit",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Agregar aquí tus códigos de verificación si los tienes
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // Para soportar safe areas en iOS
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Usar la URL ya calculada para los meta tags manuales

  return (
    <html lang="es">
      <head>
        {/* Meta tags adicionales para mayor compatibilidad con WhatsApp */}
        {/* WhatsApp a veces usa estos en lugar de los generados por Next.js */}
        {/* Nota: En SPA estático, estos meta tags se generan en build time */}
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:secure_url" content={ogImageUrl} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="Follow It - Gestión de Repartos"
        />

        {/* Meta tags de Twitter Card adicionales */}
        <meta name="twitter:image" content={ogImageUrl} />
        <meta
          name="twitter:image:alt"
          content="Follow It - Gestión de Repartos"
        />

        {/* Link alternativo a la imagen (algunas veces ayuda) */}
        <link rel="image_src" href={ogImageUrl} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <AuthGuard>{children}</AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
