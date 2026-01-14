"use client";

import { Alert } from "@/components/ui/Alert";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { resetPassword } from "@/lib/auth/client-actions";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(resetPassword, null);

  useEffect(() => {
    if (state?.success && state?.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  return (
    <AuthCard
      title="Restablecer Contraseña"
      description="Ingresa tu nueva contraseña"
    >
      {state && !state.success && state.error && (
        <Alert variant="error">{state.error}</Alert>
      )}
      {state?.success && state?.message && (
        <Alert variant="success">{state.message}</Alert>
      )}

      <form action={formAction} className="space-y-4">
        <FormInput
          id="password"
          name="password"
          type="password"
          label="Nueva Contraseña"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          hint="Mínimo 8 caracteres, una mayúscula, una minúscula y un número"
          error={
            state && !state.success ? state.fieldErrors?.password : undefined
          }
        />

        <FormInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirmar Nueva Contraseña"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          error={
            state && !state.success
              ? state.fieldErrors?.confirmPassword
              : undefined
          }
        />

        <Button type="submit" className="w-full" isLoading={isPending}>
          Actualizar Contraseña
        </Button>
      </form>
    </AuthCard>
  );
}
