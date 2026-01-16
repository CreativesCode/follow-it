"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { TrackingPageClient } from "./TrackingPageClient";

function TrackingPageContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tokenParam = searchParams.get("token");
    setToken(tokenParam);
  }, [searchParams]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Token Requerido
          </h1>
          <p className="text-gray-600 mb-4">
            Por favor, proporciona un token de seguimiento válido en la URL.
          </p>
        </div>
      </div>
    );
  }

  return <TrackingPageClient token={token} />;
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <TrackingPageContent />
    </Suspense>
  );
}
