"use client";
import { SocialPreview } from "@/components/ui/SocialPreview";
import { useEffect, useState } from "react";

export default function DebugOGPage() {
  const [metaTags, setMetaTags] = useState<
    Array<{ name: string; content: string }>
  >([]);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    // Usar requestAnimationFrame para evitar renders en cascada
    const fetchMetadata = () => {
      // Obtener la URL actual
      setCurrentUrl(window.location.href);

      // Obtener todos los meta tags
      const metas = Array.from(document.querySelectorAll("meta")).map(
        (meta) => {
          return {
            name:
              meta.getAttribute("name") ||
              meta.getAttribute("property") ||
              "unknown",
            content: meta.getAttribute("content") || "",
          };
        }
      );

      setMetaTags(metas);
    };

    requestAnimationFrame(fetchMetadata);
  }, []);

  // Filtrar meta tags relevantes para OpenGraph
  const ogTags = metaTags.filter(
    (tag) =>
      tag.name.startsWith("og:") ||
      tag.name.startsWith("twitter:") ||
      tag.name === "description"
  );

  // Variables de entorno (solo las públicas se pueden mostrar en el cliente)
  const envVars = {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "No definida",
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL || "No definida",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Debug OpenGraph Meta Tags</h1>
          <p className="text-gray-600">
            Esta página muestra todos los meta tags de OpenGraph y Twitter Card
            que están siendo generados.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">URL Actual</h2>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm break-all">
            {currentUrl}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Variables de Entorno (Públicas)
          </h2>
          <div className="space-y-2">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="border-b pb-2">
                <div className="font-semibold text-sm text-gray-600">{key}</div>
                <div className="font-mono text-sm mt-1">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Meta Tags OpenGraph y Twitter
          </h2>
          <div className="space-y-4">
            {ogTags.length === 0 ? (
              <p className="text-red-600">
                ⚠️ No se encontraron meta tags de OpenGraph
              </p>
            ) : (
              ogTags.map((tag, index) => (
                <div key={index} className="border-b pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="font-semibold text-blue-600 min-w-[200px]">
                      {tag.name}
                    </div>
                    <div className="flex-1 font-mono text-sm bg-gray-50 p-2 rounded break-all">
                      {tag.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Pruebas de Imagen OpenGraph
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                Imagen OpenGraph (debería cargar):
              </h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/opengraph.jpg"
                alt="OpenGraph preview"
                className="max-w-md border rounded shadow"
              />
            </div>
            <div className="mt-4">
              <h3 className="font-semibold mb-2">URL de la imagen:</h3>
              <a
                href="/opengraph.jpg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-mono text-sm"
              >
                {window.location.origin}/opengraph.jpg
              </a>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">
            Validadores OpenGraph
          </h2>
          <div className="space-y-2 text-sm">
            <p className="text-blue-800">
              Usa estos validadores para verificar tus meta tags:
            </p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>
                <a
                  href="https://www.opengraph.xyz/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  OpenGraph.xyz
                </a>
              </li>
              <li>
                <a
                  href="https://developers.facebook.com/tools/debug/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Facebook Sharing Debugger
                </a>
              </li>
              <li>
                <a
                  href="https://cards-dev.twitter.com/validator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Twitter Card Validator
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-900">
            ⚠️ Importante para WhatsApp
          </h2>
          <ul className="list-disc list-inside space-y-2 text-yellow-800 text-sm">
            <li>WhatsApp CACHEA agresivamente las imágenes OpenGraph</li>
            <li>
              Si cambiaste la imagen, puede tardar días en actualizarse en
              WhatsApp
            </li>
            <li>
              Para forzar actualización: cambia el nombre del archivo (ej:
              opengraph-v2.jpg)
            </li>
            <li>
              La URL debe ser HTTPS (no HTTP) y accesible públicamente (no
              localhost)
            </li>
            <li>La imagen debe ser menor a 300KB (la tuya es 140KB ✓)</li>
            <li>Dimensiones recomendadas: 1200x630px</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Vista Previa en Redes Sociales
          </h2>
          <p className="text-gray-600 mb-6">
            Así es como se verá tu enlace cuando lo compartas en diferentes
            plataformas:
          </p>
          <SocialPreview
            url={currentUrl}
            title="Follow It - Gestión de Repartos"
            description="Optimiza tus entregas con seguimiento en tiempo real, asignación inteligente y comprobantes digitales"
            imageUrl="/opengraph.jpg"
          />
        </div>
      </div>
    </div>
  );
}
