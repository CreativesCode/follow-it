"use client";

import { Alert } from "@/components/ui/Alert";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { forgotPassword } from "@/lib/auth/actions";
import Link from "next/link";
import { useActionState } from "react";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPassword, null);

  return (
    <AuthCard
      title="Recuperar Contraseña"
      description="Te enviaremos un enlace para restablecer tu contraseña"
    >
      {state && !state.success && state.error && (
        <Alert variant="error">{state.error}</Alert>
      )}
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
          error={state && !state.success ? state.fieldErrors?.email : undefined}
        />

        <Button type="submit" className="w-full" isLoading={isPending}>
          Enviar Enlace de Recuperación
        </Button>
      </form>

      <div className="flex justify-center space-x-4 text-sm">
        <Link
          href="/auth/login"
          className="text-primary-500 hover:text-primary-600 font-medium"
        >
          Volver al inicio de sesión
        </Link>
        <span className="text-gray-400">|</span>
        <Link
          href="/auth/register"
          className="text-primary-500 hover:text-primary-600 font-medium"
        >
          Crear cuenta
        </Link>
      </div>
    </AuthCard>
  );
}
