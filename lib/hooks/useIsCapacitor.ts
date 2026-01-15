"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";

/**
 * Hook para detectar si la aplicación está corriendo en Capacitor (app nativa)
 * @returns true si está en Capacitor, false si está en web
 */
export function useIsCapacitor(): boolean {
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    // Verificar si estamos en un entorno de navegador
    if (typeof window === "undefined") {
      return;
    }

    // Verificar usando Capacitor.isNativePlatform() que es más confiable
    try {
      setIsCapacitor(Capacitor.isNativePlatform());
    } catch (error) {
      // Fallback: verificar si Capacitor está disponible en window
      setIsCapacitor(
        typeof window !== "undefined" && "Capacitor" in window
      );
    }
  }, []);

  return isCapacitor;
}
