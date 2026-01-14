"use client";

import { useActionState, useEffect } from "react";
import { resetPassword } from "@/lib/auth/actions";
import { AuthCard } from "@/components/ui/AuthCard";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useRouter } from "next/navigation";

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
      {state?.error && <Alert variant="error">{state.error}</Alert>}
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
          error={state?.fieldErrors?.password}
        />

        <FormInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirmar Nueva Contraseña"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          error={state?.fieldErrors?.confirmPassword}
        />

        <Button type="submit" className="w-full" isLoading={isPending}>
          Actualizar Contraseña
        </Button>
      </form>
    </AuthCard>
  );
}
