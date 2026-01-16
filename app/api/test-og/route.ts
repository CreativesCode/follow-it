import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  // Obtener la URL base del sitio
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL ||
    "localhost:3000";

  // Asegurar protocolo HTTPS
  const baseUrl = siteUrl.startsWith("http")
    ? siteUrl
    : siteUrl.includes("localhost")
    ? `http://${siteUrl}`
    : `https://${siteUrl}`;

  const ogImageUrl = `${baseUrl}/opengraph.jpg`;

  // Intentar acceder a la imagen
  try {
    const response = await fetch(ogImageUrl, {
      method: "HEAD",
      cache: "no-store",
    });

    return NextResponse.json({
      success: true,
      status: response.status,
      statusText: response.statusText,
      imageUrl: ogImageUrl,
      headers: Object.fromEntries(response.headers.entries()),
      accessible: response.ok,
      siteUrl,
      baseUrl,
      env: {
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "not set",
        NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL || "not set",
        VERCEL_URL: process.env.VERCEL_URL || "not set",
        VERCEL_ENV: process.env.VERCEL_ENV || "not set",
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      imageUrl: ogImageUrl,
      siteUrl,
      baseUrl,
      env: {
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "not set",
        NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL || "not set",
        VERCEL_URL: process.env.VERCEL_URL || "not set",
        VERCEL_ENV: process.env.VERCEL_ENV || "not set",
      },
    });
  }
}
