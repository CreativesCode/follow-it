"use client";

import { useState } from "react";
import { resendVerificationEmail } from "@/lib/auth/actions";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import Link from "next/link";

export default function VerifyEmailPage() {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResend = async () => {
    setIsLoading(true);
    setMessage(null);

    const result = await resendVerificationEmail();

    if (result.success) {
      setMessage({ type: "success", text: result.message || "Email enviado" });
    } else {
      setMessage({ type: "error", text: result.error });
    }

    setIsLoading(false);
  };

  return (
    <AuthCard
      title="Verifica tu Email"
      description="Hemos enviado un enlace de verificación a tu correo electrónico"
    >
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-primary-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <p className="text-gray-700">
            Por favor, revisa tu bandeja de entrada y haz clic en el enlace de
            verificación para activar tu cuenta.
          </p>
          <p className="text-sm text-gray-500">
            Si no encuentras el email, revisa tu carpeta de spam.
          </p>
        </div>

        {message && (
          <Alert variant={message.type}>
            {message.text}
          </Alert>
        )}

        <Button
          onClick={handleResend}
          variant="outline"
          className="w-full"
          isLoading={isLoading}
        >
          Reenviar Email de Verificación
        </Button>

        <Link
          href="/auth/login"
          className="block text-sm text-primary-500 hover:text-primary-600 font-medium"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </AuthCard>
  );
}
