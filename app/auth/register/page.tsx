"use client";

import { useActionState, useEffect } from "react";
import { register } from "@/lib/auth/actions";
import { AuthCard } from "@/components/ui/AuthCard";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(register, null);

  useEffect(() => {
    if (state?.success && state?.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  return (
    <AuthCard
      title="Crear Cuenta"
      description="Comienza a gestionar tus repartos hoy mismo"
    >
      {state?.error && <Alert variant="error">{state.error}</Alert>}
      {state?.success && state?.message && (
        <Alert variant="success">{state.message}</Alert>
      )}

      <form action={formAction} className="space-y-4">
        <FormInput
          id="fullName"
          name="fullName"
          type="text"
          label="Nombre Completo"
          placeholder="Juan Pérez"
          required
          autoComplete="name"
          error={state?.fieldErrors?.fullName}
        />

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

        <FormInput
          id="password"
          name="password"
          type="password"
          label="Contraseña"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          hint="Mínimo 8 caracteres, una mayúscula, una minúscula y un número"
          error={state?.fieldErrors?.password}
        />

        <FormInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirmar Contraseña"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          error={state?.fieldErrors?.confirmPassword}
        />

        <div className="flex items-start">
          <input
            type="checkbox"
            name="terms"
            id="terms"
            required
            className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
            Acepto los{" "}
            <Link
              href="/terms"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Términos y Condiciones
            </Link>{" "}
            y la{" "}
            <Link
              href="/privacy"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Política de Privacidad
            </Link>
          </label>
        </div>

        <Button type="submit" className="w-full" isLoading={isPending}>
          Crear Cuenta
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        ¿Ya tienes una cuenta?{" "}
        <Link
          href="/auth/login"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Inicia sesión aquí
        </Link>
      </p>
    </AuthCard>
  );
}
