"use client";

import { Alert } from "@/components/ui/Alert";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { resetPassword } from "@/lib/auth/client-actions";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(resetPassword, null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (state?.success && state?.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  const onSubmit = (data: { password: string; confirmPassword: string }) => {
    const formData = new FormData();
    formData.append("password", data.password);
    formData.append("confirmPassword", data.confirmPassword);
    formAction(formData);
  };

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormInput
          id="password"
          type="password"
          label="Nueva Contraseña"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          hint="Mínimo 8 caracteres, una mayúscula, una minúscula y un número"
          error={
            errors.password?.message ||
            (state && !state.success ? state.fieldErrors?.password : undefined)
          }
          {...register("password")}
        />

        <FormInput
          id="confirmPassword"
          type="password"
          label="Confirmar Nueva Contraseña"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          error={
            errors.confirmPassword?.message ||
            (state && !state.success
              ? state.fieldErrors?.confirmPassword
              : undefined)
          }
          {...register("confirmPassword")}
        />

        <Button type="submit" className="w-full safe-area-bottom" isLoading={isPending}>
          Actualizar Contraseña
        </Button>
      </form>
    </AuthCard>
  );
}
