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
function getSiteUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000";

  // Asegurar que tenga https:// cuando no sea localhost
  const baseUrl = url.startsWith("http") ? url : `https://${url}`;
  // Remover trailing slash para construir URLs correctamente
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

const siteUrl = getSiteUrl();
const ogImage = `${siteUrl}/opengraph.jpg`;

export const metadata: Metadata = {
  title: "Follow It - Gestión de Repartos",
  description: "Sistema de gestión de repartos con seguimiento en tiempo real",
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
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "Follow It - Gestión de Repartos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Follow It - Gestión de Repartos",
    description:
      "Optimiza tus entregas con seguimiento en tiempo real, asignación inteligente y comprobantes digitales",
    images: [ogImage],
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
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
