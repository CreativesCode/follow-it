"use client";

import { useActionState } from "react";
import { forgotPassword } from "@/lib/auth/actions";
import { AuthCard } from "@/components/ui/AuthCard";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPassword, null);

  return (
    <AuthCard
      title="Recuperar Contraseña"
      description="Te enviaremos un enlace para restablecer tu contraseña"
    >
      {state?.error && <Alert variant="error">{state.error}</Alert>}
      {state?.success && state?.message && (
        <Alert variant="success">{state.message}</Alert>
      )}

      <form action={formAction} className="space-y-4">
        <FormInput
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="tu@email.com"
          required
          autoComplete="email"
          error={state?.fieldErrors?.email}
        />

        <Button type="submit" className="w-full" isLoading={isPending}>
          Enviar Enlace de Recuperación
        </Button>
      </form>

      <div className="flex justify-center space-x-4 text-sm">
        <Link
          href="/auth/login"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Volver al inicio de sesión
        </Link>
        <span className="text-gray-400">|</span>
        <Link
          href="/auth/register"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Crear cuenta
        </Link>
      </div>
    </AuthCard>
  );
}
